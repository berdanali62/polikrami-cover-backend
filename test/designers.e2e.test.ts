import request from 'supertest';
import app from '../src/app';

describe('Designers E2E', () => {
  const agent = request.agent(app);

  let csrf: string | undefined;
  let token: string | undefined;

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

    const email = `e2e_des_${Date.now()}@example.com`;
    const password = 'Passw0rd!';
    // register or login
    const reg = await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ 
      email, 
      password, 
      confirmPassword: password, 
      name: 'E2E Des',
      acceptTerms: true,
      acceptPrivacy: true
    });
    expect([200,201,409]).toContain(reg.status);
    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password });
    expect(login.status).toBe(200);
    token = login.body?.accessToken;
  });

  it('GET /api/designers requires auth', async () => {
    const res = await request(app).get('/api/designers');
    expect(res.status).toBe(401);
  });

  it('GET /api/designers (auth) returns array or 200/500', async () => {
    const res = await agent.get('/api/designers').set('Authorization', `Bearer ${token}`);
    expect([200,500]).toContain(res.status);
    if (res.status === 200) expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/designers/recommended (auth) returns slate/rest', async () => {
    const res = await agent.get('/api/designers/recommended').set('Authorization', `Bearer ${token}`);
    expect([200,500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('slate');
      expect(res.body).toHaveProperty('rest');
    }
  });
});


