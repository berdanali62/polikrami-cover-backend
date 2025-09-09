import request from 'supertest';
import app from '../src/app';
import sharp from 'sharp';

describe('Security & Observability E2E', () => {
  function getCookie(res: request.Response, name: string): string | undefined {
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    const found = cookies.find((c) => c.startsWith(name + '='));
    if (!found) return undefined;
    return found.split(';')[0].split('=')[1];
  }

  it('Upload magic-byte mismatch blocked and valid image sanitized', async () => {
    const agent = request.agent(app);
    // CSRF
    const csrfRes = await agent.get('/csrf');
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    // Register & login
    const email = `sec_${Date.now()}@ex.com`;
    const password = 'Passw0rd!';
    await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ email, password, confirmPassword: password, name: 'Sec User' });
    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password });
    expect(login.status).toBe(200);

    // Create draft
    const draftCreate = await agent.post('/api/drafts').set('X-CSRF-Token', String(csrf)).send({ method: 'upload' });
    expect([200, 201]).toContain(draftCreate.status);
    const draftId = draftCreate.body?.id as string;
    expect(draftId).toBeTruthy();

    // 1) Mismatch: filename .png with non-PNG bytes -> 400
    const bad = Buffer.from('not-a-png');
    const badUp = await agent
      .post(`/api/drafts/${draftId}/upload`)
      .set('X-CSRF-Token', String(csrf))
      .attach('file', bad, 'bad.png');
    expect(badUp.status).toBe(400);

    // 2) Valid: 1x1 PNG via sharp -> 201 and url
    const good = await sharp({ create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toBuffer();
    const okUp = await agent
      .post(`/api/drafts/${draftId}/upload`)
      .set('X-CSRF-Token', String(csrf))
      .attach('file', good, 'ok.png');
    expect([200, 201]).toContain(okUp.status);
    expect(okUp.body).toHaveProperty('url');
  });

  it('Account lockout after consecutive failed logins', async () => {
    const agent = request.agent(app);
    // CSRF
    const csrfRes = await agent.get('/csrf');
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    const email = `lock_${Date.now()}@ex.com`;
    const password = 'Passw0rd!';
    await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ email, password, confirmPassword: password, name: 'Lock User' });

    // 5 incorrect attempts -> 401
    for (let i = 0; i < 5; i++) {
      const res = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password: 'wrong' });
      expect([401, 429]).toContain(res.status); // last might already be 429 on some systems
    }
    // Next attempt should be blocked with 429
    const blocked = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password: 'wrong' });
    expect(blocked.status).toBe(429);
  });

  it('Refresh token reuse detection returns 401 for old token', async () => {
    const agent = request.agent(app);
    // CSRF
    const csrfRes = await agent.get('/csrf');
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    const email = `reuse_${Date.now()}@ex.com`;
    const password = 'Passw0rd!';
    await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ email, password, confirmPassword: password, name: 'Reuse User' });
    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password });
    const oldRefresh = getCookie(login, 'refresh');
    expect(oldRefresh).toBeTruthy();

    // First refresh (rotates)
    const first = await agent.post('/api/auth/refresh');
    expect(first.status).toBe(200);
    // Attempt reuse of old refresh with separate request (not agent to avoid cookie jar overwrite)
    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', [`refresh=${String(oldRefresh)}`]);
    expect([401, 403]).toContain(reuse.status);
  });

  it('Metrics endpoint is exposed', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(String(res.text || '')).toContain('polikrami_http_requests_total');
  });
});


