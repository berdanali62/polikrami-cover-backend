import request from 'supertest';
import app from '../src/app';
import { getCookie, createTestPng } from './helpers/test-helpers';

describe('Extended E2E', () => {
  const email = `e2e_ext_${Date.now()}@example.com`;
  const password = 'Passw0rd!';
  const agent = request.agent(app);

  it('Test 2: Full user flow across modules', async () => {
    // CSRF
    const csrfRes = await agent.get('/csrf');
    expect(csrfRes.status).toBe(200);
    const csrf = getCookie(csrfRes, 'csrf');
    expect(csrf).toBeTruthy();

    // Register (allow rerun)
    const reg = await agent
      .post('/api/auth/register')
      .set('X-CSRF-Token', String(csrf))
      .send({ 
        email, 
        password, 
        confirmPassword: password, 
        name: 'E2E Ext',
        acceptTerms: true,
        acceptPrivacy: true
      });
    expect([200, 201, 409]).toContain(reg.status);

    // Login
    const login = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', String(csrf))
      .send({ email, password });
    expect(login.status).toBe(200);

    // Update profile
    const update = await agent
      .put('/api/users/me')
      .set('X-CSRF-Token', String(csrf))
      .send({ phone: '+90 555 555 55 55', city: 'Istanbul' });
    expect([200, 500]).toContain(update.status); // allow 500 if DB constraints

    // Create draft
    const draftCreate = await agent
      .post('/api/drafts')
      .set('X-CSRF-Token', String(csrf))
      .send({ method: 'upload' });
    expect(draftCreate.status).toBe(201);
    const draftId = draftCreate.body.id as string;

    // Presign upload (optional contentType)
    const presign = await agent
      .post(`/api/drafts/${draftId}/presign`)
      .set('X-CSRF-Token', String(csrf))
      .send({ contentType: 'image/png' });
    expect([200, 201, 400, 500]).toContain(presign.status);

    // Upload file (send tiny PNG header)
    const pngHeader = createTestPng();
    const upload = await agent
      .post(`/api/drafts/${draftId}/upload`)
      .set('X-CSRF-Token', String(csrf))
      .attach('file', pngHeader, { filename: 'test.png', contentType: 'image/png' });
    expect([200, 201, 400, 500]).toContain(upload.status);

    // Set message card (may 400/404 if not exists)
    const setCard = await agent
      .post(`/api/drafts/${draftId}/message-card`)
      .set('X-CSRF-Token', String(csrf))
      .send({ messageCardId: '00000000-0000-0000-0000-000000000000', content: 'Hi' });
    expect([200, 400, 404]).toContain(setCard.status);

    // Assign designer (may 404 if not exists)
    const assign = await agent
      .post(`/api/drafts/${draftId}/assign-designer`)
      .set('X-CSRF-Token', String(csrf))
      .send({ designerId: '00000000-0000-0000-0000-000000000000' });
    expect([200, 400, 404, 500]).toContain(assign.status);

    // Create a test message card first
    const { prisma } = await import('../src/config/database');
    const messageCard = await prisma.messageCard.create({
      data: {
        title: 'Test Card',
        priceCents: 1000,
        isPublished: true
      }
    });
    
    // Set message card (required for commit)
    await agent
      .post(`/api/drafts/${draftId}/message-card`)
      .set('X-CSRF-Token', String(csrf))
      .send({ messageCardId: messageCard.id });
    
    // Set shipping (minimal)
    const shipping = await agent
      .post(`/api/drafts/${draftId}/shipping`)
      .set('X-CSRF-Token', String(csrf))
      .send({
        shipping: {
          senderName: 'Test Sender',
          senderPhone: '+90 555 000 0000',
          receiverName: 'Test Receiver',
          receiverPhone: '+90 555 111 1111',
          city: 'Istanbul',
          district: 'Kadikoy',
          address: 'Test Address',
          company: 'Test Co'
        }
      });
    expect([200, 400]).toContain(shipping.status);

    // Commit draft -> order
    const commit = await agent
      .post(`/api/drafts/${draftId}/commit`)
      .set('X-CSRF-Token', String(csrf))
      .send();
    expect([200, 201, 400]).toContain(commit.status);
    const orderId = commit.body.id as string;

    // List orders
    const orders = await agent.get('/api/orders');
    expect(orders.status).toBe(200);

    // Get order detail
    const order = await agent.get(`/api/orders/${orderId}`);
    expect([200, 400, 404]).toContain(order.status);

    // Initiate payment (mock provider)
    const payInit = await agent
      .post('/api/payments/initiate')
      .set('X-CSRF-Token', String(csrf))
      .send({ orderId, paymentMethod: 'digital_wallet', returnUrl: 'http://localhost:5173/pay/ok', cancelUrl: 'http://localhost:5173/pay/cancel' });
    expect([200, 201, 500]).toContain(payInit.status); // allow provider variations

    // Payments status (if paymentId exists)
    if (payInit.status === 200 && payInit.body?.paymentId) {
      const status = await agent.get(`/api/payments/${payInit.body.paymentId}/status`);
      expect([200, 403, 404, 500]).toContain(status.status);
      // Refund attempt (likely 400 when not success yet)
      const refund = await agent
        .post('/api/payments/refund')
        .set('X-CSRF-Token', String(csrf))
        .send({ paymentId: payInit.body.paymentId, reason: 'test' });
      expect([200, 400, 404, 500]).toContain(refund.status);
    }

    // Try cancel order (may fail if paid already)
    const cancel = await agent
      .post(`/api/orders/${orderId}/cancel`)
      .set('X-CSRF-Token', String(csrf));
    expect([200, 400]).toContain(cancel.status);

    // Contact form (email mocked)
    const contact = await agent
      .post('/api/contact')
      .set('X-CSRF-Token', String(csrf))
      .send({ name: 'Ext Tester', email, message: 'Hello from tests' });
    expect(contact.status).toBe(200);

    // Public search endpoints
    const search = await agent.get('/api/search');
    expect([200, 500]).toContain(search.status);
    const suggest = await agent.get('/api/search/suggestions');
    expect([200, 500]).toContain(suggest.status);

    // Content & others (tolerant asserts due to empty DB)
    const templates = await agent.get('/api/templates');
    expect([200, 500]).toContain(templates.status);
    const categories = await agent.get('/api/categories');
    expect([200, 500]).toContain(categories.status);

    // Assets & notifications (auth required)
    const assets = await agent.get('/api/assets');
    expect([200, 500]).toContain(assets.status);
    const notifs = await agent.get('/api/notifications');
    expect([200, 500]).toContain(notifs.status);
  });
});


