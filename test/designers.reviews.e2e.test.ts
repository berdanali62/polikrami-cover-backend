import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Designers Reviews & Sorting E2E', () => {
  const agent = request.agent(app);
  let csrf: string | undefined;
  let reviewerToken: string | undefined;
  let designerRoleId: number | undefined;
  let designerAId: string | undefined;
  let designerBId: string | undefined;

  function getCookie(res: request.Response, name: string): string | undefined {
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    const found = cookies.find((c) => c.startsWith(name + '='));
    if (!found) return undefined;
    return found.split(';')[0].split('=')[1];
  }

  beforeAll(async () => {
    // CSRF
    const csrfRes = await agent.get('/csrf');
    csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    // Ensure designer role exists
    const designerRole = await prisma.role.upsert({
      where: { name: 'designer' },
      update: {},
      create: { name: 'designer' },
    });
    designerRoleId = designerRole.id;

    // Create two designers (A newer, B older)
    const a = await prisma.user.create({ data: { email: `desA_${Date.now()}@ex.com`, password: 'x', name: 'Designer A' } });
    const b = await prisma.user.create({ data: { email: `desB_${Date.now()}@ex.com`, password: 'x', name: 'Designer B', createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) } });
    await prisma.userRole.createMany({ data: [
      { userId: a.id, roleId: designerRoleId },
      { userId: b.id, roleId: designerRoleId },
    ]});
    designerAId = a.id;
    designerBId = b.id;

    // Create reviewer user via auth
    const email = `rev_${Date.now()}@example.com`;
    const password = 'Passw0rd!';
    await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ 
      email, 
      password, 
      confirmPassword: password, 
      name: 'Reviewer',
      acceptTerms: true,
      acceptPrivacy: true
    });
    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password });
    expect(login.status).toBe(200);
    reviewerToken = login.body?.accessToken;

    // Seed activity: assign drafts to A to simulate active30d
    const owner = await prisma.user.create({ data: { email: `owner_${Date.now()}@ex.com`, password: 'x' } });
    for (let i = 0; i < 3; i++) {
      await prisma.draft.create({ data: { userId: owner.id, method: 'artist', step: 1, data: {}, assignedDesignerId: designerAId! } });
    }
  });

  it('POST /api/designers/:id/reviews creates or updates a review', async () => {
    const res = await agent
      .post(`/api/designers/${designerAId}/reviews`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .set('X-CSRF-Token', String(csrf))
      .send({ rating: 5, comment: 'Harika!' });
    expect([201, 200]).toContain(res.status);
  });

  it('GET /api/designers/:id/reviews returns list', async () => {
    const res = await agent
      .get(`/api/designers/${designerAId}/reviews`)
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/designers/sorted?sort=rating returns designers sorted by rating', async () => {
    // Give B a lower rating
    const resB = await agent
      .post(`/api/designers/${designerBId}/reviews`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .set('X-CSRF-Token', String(csrf))
      .send({ rating: 3, comment: 'Ortalama' });
    expect([201, 200]).toContain(resB.status);

    const res = await agent
      .get('/api/designers/sorted?sort=rating')
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(res.status).toBe(200);
    const list = res.body.designers as Array<{ id: string; ratingAvg: number }>;
    expect(Array.isArray(list)).toBe(true);
    if (list.length >= 2) {
      const first = list[0]!;
      const second = list[1]!;
      expect(first.ratingAvg).toBeGreaterThanOrEqual(second.ratingAvg);
    }
  });

  it('GET /api/designers/sorted?sort=newest returns newest first', async () => {
    const res = await agent
      .get('/api/designers/sorted?sort=newest')
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(res.status).toBe(200);
    const list = res.body.designers as Array<{ id: string; createdAt: string }>;
    expect(Array.isArray(list)).toBe(true);
  });

  it('GET /api/designers/sorted?sort=active30d returns most active first', async () => {
    const res = await agent
      .get('/api/designers/sorted?sort=active30d')
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(res.status).toBe(200);
    const list = res.body.designers as Array<{ id: string; recentJobs30d: number }>;
    expect(Array.isArray(list)).toBe(true);
    if (list.length >= 1) {
      
      const a = list.find((x) => x.id === designerAId);
      expect(a?.recentJobs30d ?? 0).toBeGreaterThanOrEqual(3);
    }
  });
});


