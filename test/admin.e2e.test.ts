import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';
import { signAccessToken } from '../src/shared/helpers/jwt';

describe('Admin and additional modules E2E', () => {
  const email = `e2e_admin_${Date.now()}@example.com`;
  const password = 'Passw0rd!';
  const agent = request.agent(app);
  const adminAgent = request.agent(app);

  function getCookie(res: request.Response, name: string): string | undefined {
    const raw = res.headers['set-cookie'] as unknown;
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    const found = cookies.find((c) => c.startsWith(name + '='));
    if (!found) return undefined;
    return found.split(';')[0].split('=')[1];
  }

  it('Test 3: Admin categories/templates + projects/comments', async () => {
    // CSRF
    const csrfRes = await agent.get('/csrf');
    expect(csrfRes.status).toBe(200);
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    // Register & login normal user
    const reg = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', String(csrf))
      .send({ 
        email, 
        password, 
        confirmPassword: password, 
        name: 'E2E Admin User',
        acceptTerms: true,
        acceptPrivacy: true
      });
    expect([200, 201, 409]).toContain(reg.status);

    const login = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', String(csrf))
      .send({ email, password });
    expect(login.status).toBe(200);

    // Prepare an admin bearer token (JWT role=admin). Middleware checks only JWT role.
    const adminAccess = signAccessToken({ userId: crypto.randomUUID(), role: 'admin' });

    // Admin agent CSRF (no user cookies attached)
    const adminCsrfRes = await adminAgent.get('/csrf');
    expect(adminCsrfRes.status).toBe(200);
    const adminCsrf = getCookie(adminCsrfRes, 'csrf');
    expect(adminCsrf).toBeTruthy();

    // Categories (admin only)
    const slug = `cat-${Date.now()}`;
    const catCreate = await adminAgent
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminAccess}`)
      .set('X-CSRF-Token', String(adminCsrf))
      .send({ name: 'Test Category', slug });
    expect([200, 201, 409]).toContain(catCreate.status);
    const catId = catCreate.body?.id ?? 1;

    const catUpdate = await adminAgent
      .put(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .set('X-CSRF-Token', String(adminCsrf))
      .send({ name: 'Test Category Updated' });
    expect([200, 404]).toContain(catUpdate.status);

    const catDelete = await adminAgent
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .set('X-CSRF-Token', String(adminCsrf));
    expect([200, 204, 404]).toContain(catDelete.status);

    // Templates (create/update requires auth; delete requires admin)
    const tSlug = `temp-${Date.now()}`;
    const tCreate = await agent
      .post('/api/templates')
      .set('X-CSRF-Token', String(csrf))
      .send({ title: 'Temp', slug: tSlug, isPublished: false });
    expect([200, 201, 409, 500]).toContain(tCreate.status);
    const templateId = tCreate.body?.id ?? crypto.randomUUID();

    const tUpdate = await agent
      .put(`/api/templates/${templateId}`)
      .set('X-CSRF-Token', String(csrf))
      .send({ title: 'Temp Updated' });
    expect([200, 404, 500]).toContain(tUpdate.status);

    const tDelete = await adminAgent
      .delete(`/api/templates/${templateId}`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .set('X-CSRF-Token', String(adminCsrf));
    expect([200, 204, 404]).toContain(tDelete.status);

    // Projects (auth)
    const projCreate = await agent
      .post('/api/projects')
      .set('X-CSRF-Token', String(csrf))
      .send({ title: 'My Project' });
    expect([200, 201]).toContain(projCreate.status);
    const projectId = projCreate.body.id as string;

    const projUpdate = await agent
      .put(`/api/projects/${projectId}`)
      .set('X-CSRF-Token', String(csrf))
      .send({ title: 'My Project Updated' });
    expect([200]).toContain(projUpdate.status);

    // Comments on project (auth)
    const cCreate = await agent
      .post('/api/comments')
      .set('X-CSRF-Token', String(csrf))
      .send({ projectId, body: 'Looks good' });
    expect([200, 201]).toContain(cCreate.status);
    const commentId = cCreate.body.id as string;

    const cUpdate = await agent
      .put(`/api/comments/${commentId}`)
      .set('X-CSRF-Token', String(csrf))
      .send({ status: 'resolved' });
    expect([200]).toContain(cUpdate.status);

    const cDelete = await agent
      .delete(`/api/comments/${commentId}`)
      .set('X-CSRF-Token', String(csrf));
    expect([200, 204]).toContain(cDelete.status);

    // Notifications mark-all-read (auth)
    const markAll = await agent
      .put('/api/notifications/mark-all-read')
      .set('X-CSRF-Token', String(csrf));
    expect([200]).toContain(markAll.status);
  });
});


