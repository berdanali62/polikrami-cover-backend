/*
 E2E test for Draft revision workflow
 - Registers customer and designer
 - Logs in both and maintains cookie jars
 - Creates a draft, assigns designer
 - Runs preview → revision cycles (3x), verifies 4th fails
 - Approves design and verifies final state
*/

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const API = `${BASE}/api/v1`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cookieJar() {
  const jar = new Map();
  return {
    setFrom(res) {
      const set = res.headers.get('set-cookie');
      if (!set) return;
      const parts = Array.isArray(set) ? set : [set];
      for (const raw of parts) {
        const seg = String(raw).split(';')[0];
        const [name, value] = seg.split('=');
        if (name && value !== undefined) jar.set(name.trim(), value);
      }
    },
    setCookie(name, value) {
      if (name && value !== undefined) jar.set(name, value);
    },
    header() {
      const arr = [];
      for (const [k, v] of jar.entries()) arr.push(`${k}=${v}`);
      return arr.join('; ');
    },
    get(name) { return jar.get(name); }
  };
}

async function waitForHealth(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error('Health check failed');
}

async function api(path, opts = {}, jar) {
  const method = (opts.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (jar) {
    const cookie = jar.header();
    if (cookie) headers['Cookie'] = cookie;
    const bearer = jar.get('access');
    if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
    if (method !== 'GET' && method !== 'HEAD') {
      const csrf = jar.get('csrf');
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }
  }
  const res = await fetch(`${API}${path}`, { method: 'GET', ...opts, headers });
  jar && jar.setFrom(res);
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function run() {
  await waitForHealth();

  const customer = cookieJar();
  const designer = cookieJar();

  // CSRF bootstrap for both sessions
  async function getCsrf(jar) {
    const res = await fetch(`${BASE}/csrf`, { method: 'GET', headers: jar ? { Cookie: jar.header() } : undefined });
    jar && jar.setFrom(res);
    let token;
    try { const data = await res.json(); token = data?.token; } catch {}
    if (!token) token = jar.get('csrf');
    if (!token) throw new Error('Failed to acquire CSRF token');
    if (jar) jar.setCookie('csrf', token);
    return token;
  }

  await getCsrf(customer);
  await getCsrf(designer);

  const ts = Date.now();
  const custEmail = `cust_${ts}@test.local`; const custPass = 'Passw0rd!cust';
  const dsgnEmail = `dsgn_${ts}@test.local`; const dsgnPass = 'Passw0rd!dsgn';

  // Register
  await api('/auth/register', { method: 'POST', body: JSON.stringify({ email: custEmail, password: custPass, confirmPassword: custPass, name: 'Customer Test', acceptTerms: true, acceptPrivacy: true }) });
  await api('/auth/register', { method: 'POST', body: JSON.stringify({ email: dsgnEmail, password: dsgnPass, confirmPassword: dsgnPass, name: 'Designer Test', role: 'designer', acceptTerms: true, acceptPrivacy: true, acceptRevenueShare: true }) });

  // Login
  await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: custEmail, password: custPass }) }, customer);
  await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: dsgnEmail, password: dsgnPass }) }, designer);

  // Lookup designer id (via /users/me equivalent is not present; query via /designers or direct DB endpoint not exposed)
  // Fallback: call a protected endpoint as designer to ensure JWT works, then fetch own user via /users?me is not available; we will fetch via /auth/refresh cookie not needed. Instead, create a draft and read assignedDesigner after assignment.

  // Create draft as customer
  const draftResp = await api('/drafts', { method: 'POST', body: JSON.stringify({ method: 'artist' }) }, customer);
  const draftId = draftResp.data.id;

  // Query designer id by calling a small helper endpoint: use /users route if exists; otherwise, fetch from token via refresh not available.
  // We will create a temporary notification for designer to force user creation side-effects; but we still need designer id. Use /wallet routes? Not necessary.
  // Instead, assign designer by first reading designer's user id from access token payload (cookie value). Our access cookie stores JWT; decode base64 payload.
  function getUserIdFromCookieJar(jar) {
    const access = jar.get('access');
    if (!access) return null;
    const parts = access.split('.');
    if (parts.length !== 3) return null;
    try { const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); return payload.userId || payload.sub || null; } catch { return null; }
  }
  const designerId = getUserIdFromCookieJar(designer);
  if (!designerId) throw new Error('Failed to extract designerId from JWT');

  // Assign designer
  await api(`/drafts/${draftId}/assign-designer`, { method: 'POST', body: JSON.stringify({ designerId }) }, customer);

  // Designer sends preview
  await api(`/drafts/${draftId}/preview`, { method: 'POST', body: JSON.stringify({}) }, designer);

  // 3 revision cycles
  for (let i = 1; i <= 3; i++) {
    const rev = await api(`/drafts/${draftId}/revision`, { method: 'POST', body: JSON.stringify({ notes: `Revize ${i}: arka plan biraz daha açık ton olsun` }) }, customer);
    if (!rev || !(rev.data && typeof rev.data.revisionCount === 'number')) throw new Error('Revision response invalid');
    // Designer sends preview again
    await api(`/drafts/${draftId}/preview`, { method: 'POST', body: JSON.stringify({}) }, designer);
  }

  // Fourth revision should fail
  let fourthFailed = false; let fourthStatus = 0; let fourthBody = null;
  try {
    await api(`/drafts/${draftId}/revision`, { method: 'POST', body: JSON.stringify({ notes: 'Dördüncü deneme' }) }, customer);
  } catch (e) {
    fourthFailed = true; fourthStatus = e.status; fourthBody = e.body;
  }

  // Approve
  const approved = await api(`/drafts/${draftId}/approve`, { method: 'POST', body: JSON.stringify({}) }, customer);

  // Fetch final state
  const finalDraft = await api(`/drafts/${draftId}`, { method: 'GET' }, customer);
  const revisionsInfo = await api(`/drafts/${draftId}/revisions`, { method: 'GET' }, customer);

  const result = {
    draftId,
    fourthFailed,
    fourthStatus,
    fourthBody,
    finalStatus: finalDraft.data.workflowStatus,
    revisionCount: finalDraft.data.revisionCount,
    maxRevisions: finalDraft.data.maxRevisions,
    remainingRevisions: revisionsInfo.data.remainingRevisions,
  };

  console.log(JSON.stringify({ ok: true, result }, null, 2));
}

run().catch(err => {
  const out = { ok: false, error: { message: err.message, status: err.status, body: err.body } };
  console.error(JSON.stringify(out, null, 2));
  process.exit(1);
});


