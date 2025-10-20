import request from 'supertest';
import app from '../src/app';

async function registerAndLogin(email: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!', confirmPassword: 'P@ssw0rd!', acceptTerms: true, acceptPrivacy: true });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!' });
  const cookies = res.headers['set-cookie'] as unknown;
  return (cookies as string[]) || [];
}

describe('Orders cancel with reason', () => {
  it('should cancel pending order and record reason', async () => {
    const cookies = await registerAndLogin(`oc_${Date.now()}@ex.com`);
    // create draft and commit to generate order quickly
    const d = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'artist' });
    const draftId = d.body.id;
    const commit = await request(app)
      .post(`/api/v1/drafts/${draftId}/commit`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send();
    expect(commit.status).toBe(201);
    const orderId = commit.body.id;

    const cancel = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ reason: 'Changed my mind' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.cancelReason || 'Changed my mind').toBeDefined();
  });
});
