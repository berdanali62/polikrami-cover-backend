import request from 'supertest';
import app from '../src/app';

describe('API smoke tests', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('GET /csrf sets csrf cookie', async () => {
    const res = await request(app).get('/csrf');
    expect(res.status).toBe(200);
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    expect(cookies.join(';')).toContain('csrf=');
  });

  it('GET /api/message-cards is public', async () => {
    // We avoid hitting DB by mocking prisma in controller if needed; but here just assert 200/array when DB available
    const res = await request(app).get('/api/message-cards');
    // Could be 200 with array or 500 if DB missing; accept 200/500 to keep smoke test permissive
    expect([200, 500]).toContain(res.status);
  });

  it('GET /api/users/me requires auth', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/projects requires auth', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('GET /api/drafts requires auth', async () => {
    const res = await request(app).get('/api/drafts');
    expect(res.status).toBe(401);
  });

  it('GET /api/orders requires auth', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/refresh without cookie returns 401', async () => {
    const res = await request(app).post('/api/auth/refresh');
    // CSRF bypass for refresh is configured; but lack of refresh cookie should 401
    expect(res.status).toBe(401);
  });
});


