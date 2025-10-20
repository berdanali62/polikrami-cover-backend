import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

async function registerAndLogin(email: string, role: 'user' | 'designer' = 'user') {
  await request(app)
    .post('/api/v1/auth/register')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!', confirmPassword: 'P@ssw0rd!', acceptTerms: true, acceptPrivacy: true, role, acceptRevenueShare: role === 'designer' ? true : undefined });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!' });
  const cookies = res.headers['set-cookie'] as unknown;
  return (cookies as string[]) || [];
}

describe('Draft workflow', () => {
  it('user and designer go through preview/revision/approve', async () => {
    const userCookies = await registerAndLogin(`wf_u_${Date.now()}@ex.com`, 'user');
    const designerCookies = await registerAndLogin(`wf_d_${Date.now()}@ex.com`, 'designer');

    // create a draft (user)
    const d = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', userCookies)
      .set('x-csrf-token', 't')
      .send({ method: 'artist' });
    expect(d.status).toBe(201);
    const draftId = d.body.id;

    // assign designer (user)
    const me = await request(app).get('/api/v1/users/me').set('Cookie', designerCookies);
    const designerId = me.body.id;
    const assign = await request(app)
      .post(`/api/v1/drafts/${draftId}/assign-designer`)
      .set('Cookie', userCookies)
      .set('x-csrf-token', 't')
      .send({ designerId });
    expect(assign.status).toBe(200);

    // designer sends preview
    const prev = await request(app)
      .post(`/api/v1/drafts/${draftId}/preview`)
      .set('Cookie', designerCookies)
      .set('x-csrf-token', 't')
      .send();
    expect(prev.status).toBe(200);

    // user requests revision
    const rev = await request(app)
      .post(`/api/v1/drafts/${draftId}/revision`)
      .set('Cookie', userCookies)
      .set('x-csrf-token', 't')
      .send();
    expect(rev.status).toBe(200);

    // designer sends preview again
    const prev2 = await request(app)
      .post(`/api/v1/drafts/${draftId}/preview`)
      .set('Cookie', designerCookies)
      .set('x-csrf-token', 't')
      .send();
    expect(prev2.status).toBe(200);

    // user approves
    const appr = await request(app)
      .post(`/api/v1/drafts/${draftId}/approve`)
      .set('Cookie', userCookies)
      .set('x-csrf-token', 't')
      .send();
    expect(appr.status).toBe(200);
  });

  it('allows user to upload a file to a draft (PDF path)', async () => {
    const userCookies = await registerAndLogin(`wf_up_${Date.now()}@ex.com`, 'user');

    // create a draft with upload method
    const d = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', userCookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(d.status).toBe(201);
    const draftId = d.body.data?.id || d.body.id || d.body?.data?.data?.id; // be tolerant to shape

    // minimal valid PDF header to satisfy magic-bytes and skip image sanitization
    const pdfHeader = Buffer.concat([
      Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A]), // %PDF-1.4\n
      Buffer.alloc(256, 0x20),
    ]);

    const up = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', userCookies)
      .set('x-csrf-token', 't')
      .attach('file', pdfHeader, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect([200,201]).toContain(up.status);
    const body = up.body || {};
    const data = body.data || body;
    expect(data).toBeTruthy();
    expect(data.url || data.data?.url).toBeTruthy();
  });
});
