import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Designers public', () => {
  let designerId: string;

  beforeAll(async () => {
    // create a designer user and attach role and profile
    const u = await prisma.user.create({ data: { email: `d_${Date.now()}@ex.com`, password: 'x' } });
    const role = await prisma.role.upsert({ where: { name: 'designer' }, update: {}, create: { name: 'designer' } });
    await prisma.userRole.create({ data: { userId: u.id, roleId: role.id } });
    // Tolerate optional columns by raw SQL if needed
    try {
      await prisma.$executeRawUnsafe(`INSERT INTO "UserProfile" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`, u.id);
    } catch {}
    designerId = u.id;
  });

  it('should fetch public profile', async () => {
    const res = await request(app).get(`/api/v1/designers/public/${designerId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(designerId);
    expect(res.body.rating).toBeDefined();
  });

  it('should search designers', async () => {
    const res = await request(app).get('/api/v1/designers/public').query({ skill: 'cover', limit: 5 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
