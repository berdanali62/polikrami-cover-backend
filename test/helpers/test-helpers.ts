import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

/**
 * Get cookie from response headers
 */
export function getCookie(res: request.Response, name: string): string | undefined {
  const raw = res.headers['set-cookie'] as unknown;
  const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  const found = cookies.find((c) => c.startsWith(name + '='));
  if (!found) return undefined;
  return found.split(';')[0].split('=')[1];
}

/**
 * Register and login user, return cookies
 */
export async function registerAndLogin(
  email: string, 
  role: 'user' | 'designer' = 'user'
): Promise<string[]> {
  await request(app)
    .post('/api/v1/auth/register')
    .set('x-csrf-token', 't')
    .send({ 
      email, 
      password: 'P@ssw0rd!', 
      confirmPassword: 'P@ssw0rd!', 
      acceptTerms: true, 
      acceptPrivacy: true, 
      role, 
      acceptRevenueShare: role === 'designer' ? true : undefined 
    });
  
  // If designer, assign role to database
  if (role === 'designer') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Ensure designer role exists
      const designerRole = await prisma.role.upsert({
        where: { name: 'designer' },
        update: {},
        create: { name: 'designer' },
      });
      // Assign role to user
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: designerRole.id } },
        update: {},
        create: { userId: user.id, roleId: designerRole.id },
      });
    }
  }
  
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', 't')
    .send({ email, password: 'P@ssw0rd!' });
  const cookies = res.headers['set-cookie'] as unknown;
  return (cookies as string[]) || [];
}

/**
 * Get CSRF token from agent
 */
export async function getCsrf(agent: request.SuperAgentTest): Promise<string> {
  const res = await agent.get('/csrf');
  return getCookie(res, 'csrf') as string;
}

/**
 * Bootstrap session with CSRF token
 */
export async function bootstrapSession(agent: request.SuperAgentTest) {
  const csrf = await getCsrf(agent);
  const email = `test_${Date.now()}@ex.com`;
  const password = 'P@ssw0rd!1';
  await agent.post('/api/auth/register').set('X-CSRF-Token', String(csrf)).send({ 
    email, 
    password, 
    confirmPassword: password,
    acceptTerms: true,
    acceptPrivacy: true
  });
  await agent.post('/api/auth/login').set('X-CSRF-Token', String(csrf)).send({ email, password });
  return { csrf, email };
}

/**
 * Extract draft ID from response (handles different response formats)
 */
export function extractDraftId(body: any): string {
  return body.data?.id || body.id || body?.data?.data?.id;
}

/**
 * Create a test PDF buffer
 */
export function createTestPdf(): Buffer {
  return Buffer.concat([
    Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A]), // %PDF-1.4\n
    Buffer.alloc(256, 0x20),
  ]);
}

/**
 * Create a test PNG buffer
 */
export function createTestPng(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
}

/**
 * Create a test message card
 */
export async function createTestMessageCard(data?: Partial<{
  title: string;
  priceCents: number;
  isPublished: boolean;
}>) {
  return await prisma.messageCard.create({
    data: {
      title: data?.title || 'Test Card',
      priceCents: data?.priceCents || 1000,
      isPublished: data?.isPublished ?? true
    }
  });
}

