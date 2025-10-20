import request from 'supertest';
import app from '../src/app';

describe('Auth register acceptance', () => {
  it('should reject without acceptTerms', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('x-csrf-token', 't')
      .send({ email: `r_${Date.now()}@ex.com`, password: 'P@ssw0rd!', confirmPassword: 'P@ssw0rd!', acceptPrivacy: true });
    expect(res.status).toBe(400);
  });

  it('should reject designer without revenue share acceptance', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('x-csrf-token', 't')
      .send({ email: `r2_${Date.now()}@ex.com`, password: 'P@ssw0rd!', confirmPassword: 'P@ssw0rd!', acceptTerms: true, acceptPrivacy: true, role: 'designer' });
    expect(res.status).toBe(400);
  });

  it('should allow user with required acceptances', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('x-csrf-token', 't')
      .send({ email: `r3_${Date.now()}@ex.com`, password: 'P@ssw0rd!', confirmPassword: 'P@ssw0rd!', acceptTerms: true, acceptPrivacy: true });
    expect(res.status).toBe(201);
  });
});
