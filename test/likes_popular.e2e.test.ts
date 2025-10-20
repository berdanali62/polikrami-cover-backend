import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

async function registerAndLogin(email: string, role: 'user' | 'designer' = 'user') {
  await request(app)
    .post('/api/v1/auth/register')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!', confirmPassword: 'P@ssw0rd!', acceptTerms: true, acceptPrivacy: true, role });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!' });
  const cookies = res.headers['set-cookie'] as unknown;
  return (cookies as string[]) || [];
}

describe('Likes and Popular Message Cards', () => {
  let cardId: string;

  beforeAll(async () => {
    // seed one message card
    const card = await prisma.messageCard.create({ data: { title: 'Test Card', isPublished: true, priceCents: 1000 } });
    cardId = card.id;
  });

  it('should toggle like and reflect in summary', async () => {
    const cookies = await registerAndLogin(`u_${Date.now()}@ex.com`);

    // ensure initial summary
    const s0 = await request(app).get(`/api/v1/likes/cards/${cardId}/summary`);
    expect(s0.status).toBe(200);
    const initial = s0.body.likes as number;

    // like
    const l1 = await request(app)
      .post('/api/v1/likes/toggle')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ messageCardId: cardId });
    expect(l1.status).toBe(201);

    const s1 = await request(app).get(`/api/v1/likes/cards/${cardId}/summary`);
    expect(s1.status).toBe(200);
    expect(s1.body.likes).toBe(initial + 1);

    // unlike
    const l2 = await request(app)
      .post('/api/v1/likes/toggle')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ messageCardId: cardId });
    expect(l2.status).toBe(200);

    const s2 = await request(app).get(`/api/v1/likes/cards/${cardId}/summary`);
    expect(s2.status).toBe(200);
    expect(s2.body.likes).toBe(initial);
  });

  it('should list popular message cards', async () => {
    const res = await request(app).get('/api/v1/message-cards/popular');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
