import request from 'supertest';
import app from '../src/app';

describe('Phone verification E2E', () => {
  const email = `pv_${Date.now()}@example.com`;
  const password = 'Passw0rd!';
  const phone = '+905551112233';
  const agent = request.agent(app);

  function getCookie(res: request.Response, name: string): string | undefined {
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    const found = cookies.find((c) => c.startsWith(name + '='));
    if (!found) return undefined;
    return found.split(';')[0].split('=')[1];
  }

  it('register → login → send code → verify', async () => {
    const csrfRes = await agent.get('/csrf');
    expect(csrfRes.status).toBe(200);
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    const reg = await agent
      .post('/api/v1/auth/register')
      .set('X-CSRF-Token', String(csrf))
      .send({ email, password, confirmPassword: password, name: 'Phone User', acceptTerms: true, acceptPrivacy: true });
    expect([200, 201, 409]).toContain(reg.status);

    const login = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', String(csrf))
      .send({ email, password });
    expect(login.status).toBe(200);

    const send = await agent
      .post('/api/v1/users/phone/send-code')
      .set('X-CSRF-Token', String(csrf))
      .send({ phone });
    expect(send.status).toBe(200);

    // In test env, service exposes last code
    const last = (global as any).__LAST_PHONE_CODE__;
    expect(last?.phone).toBe(phone);
    const code = last?.code;
    expect(code).toBeTruthy();

    const verify = await agent
      .post('/api/v1/users/phone/verify')
      .set('X-CSRF-Token', String(csrf))
      .send({ phone, code });
    expect(verify.status).toBe(200);
  });
});


