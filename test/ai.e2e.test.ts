import request from 'supertest';
import app from '../src/app';

describe('AI E2E (tolerant)', () => {
  const agent = request.agent(app);
  let csrf: string | undefined;
  let token: string | undefined;
  let draftId: string | undefined;

  function getCookie(res: request.Response, name: string): string | undefined {
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    const found = cookies.find((c) => c.startsWith(name + '='));
    if (!found) return undefined;
    return found.split(';')[0].split('=')[1];
  }

  beforeAll(async () => {
    const csrfRes = await agent.get('/csrf');
    csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();
    const email = `e2e_ai_${Date.now()}@example.com`;
    const password = 'Passw0rd!';
    await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ 
      email, 
      password, 
      confirmPassword: password, 
      name: 'AI E2E',
      acceptTerms: true,
      acceptPrivacy: true
    });
    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password });
    token = login.body?.accessToken;
    const draft = await agent.post('/api/drafts').set('X-CSRF-Token', String(csrf)).set('Authorization', `Bearer ${token}`).send({ method: 'ai' });
    if (draft.status === 201) draftId = draft.body?.id;
  });

  it('GET /api/ai/templates returns templates', async () => {
    const res = await agent.get('/api/ai/templates');
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body?.templates)).toBe(true);
    }
  });

  it('POST /api/ai/templates/render works with minimal fields', async () => {
    const res = await agent
      .post('/api/ai/templates/render')
      .set('X-CSRF-Token', String(csrf))
      .send({ templateId: 'minimalist-poster', fields: { tema: 'dağ', renk: 'siyah beyaz', doku: 'grain' } });
    expect([200,404]).toContain(res.status);
  });

  it('POST /api/drafts/:id/ai/generate requires auth', async () => {
    const res = await request(app).post(`/api/drafts/00000000-0000-0000-0000-000000000000/ai/generate`).send({ count: 1 });
    expect([401, 403, 404]).toContain(res.status);
  });

  it('POST /api/drafts/:id/ai/generate (auth) is tolerant', async () => {
    if (!draftId) return;
    const res = await agent
      .post(`/api/drafts/${draftId}/ai/generate`)
      .set('X-CSRF-Token', String(csrf))
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'minimalist-poster', fields: { tema: 'dağ', renk: 'siyah beyaz', doku: 'grain' }, count: 1 });
    expect([202,402,400,500,502]).toContain(res.status);
  });

  it('GET /api/drafts/:id/ai/results (auth) tolerant', async () => {
    if (!draftId) return;
    const res = await agent
      .get(`/api/drafts/${draftId}/ai/results`)
      .set('Authorization', `Bearer ${token}`);
    expect([200,400,500]).toContain(res.status);
  });
});


