import request from 'supertest';
import app from '../src/app';

describe('Auth E2E', () => {
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'Passw0rd!';

  const agent = request.agent(app);

  function getCookie(res: request.Response, name: string): string | undefined {
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    const found = cookies.find((c) => c.startsWith(name + '='));
    if (!found) return undefined;
    return found.split(';')[0].split('=')[1];
  }

  it('Test 1: CSRF → register → login → refresh → me → logout', async () => {
    // 1) Get CSRF cookie
    const csrfRes = await agent.get('/csrf');
    expect(csrfRes.status).toBe(200);
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    // 2) Register
    const reg = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', String(csrf))
      .send({ 
        email, 
        password, 
        confirmPassword: password, 
        name: 'E2E User',
        acceptTerms: true,
        acceptPrivacy: true
      });
    expect([200, 201, 409]).toContain(reg.status); // allow reruns (409 email exists)

    // 3) Login
    const login = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', String(csrf))
      .send({ email, password });
    expect(login.status).toBe(200);
    const access = getCookie(login, 'access');
    const refresh = getCookie(login, 'refresh');
    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();

    // 4) /users/me with auth
    const me = await agent.get('/api/users/me');
    expect(me.status).toBe(200);
    expect(me.body).toHaveProperty('email');

    // 5) Refresh (CSRF bypassed)
    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);
    const newAccess = getCookie(refreshRes, 'access');
    const newRefresh = getCookie(refreshRes, 'refresh');
    expect(newAccess).toBeTruthy();
    expect(newRefresh).toBeTruthy();

    // 6) Logout (requires CSRF and cookies present)
    const logout = await agent
      .post('/api/auth/logout')
      .set('X-CSRF-Token', String(csrf));
    expect(logout.status).toBe(200);
  });
});


