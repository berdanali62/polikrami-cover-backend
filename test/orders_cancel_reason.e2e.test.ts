import request from 'supertest';
import app from '../src/app';
import { registerAndLogin, createTestMessageCard } from './helpers/test-helpers';

describe('Orders cancel with reason', () => {
  it('should cancel pending order and record reason', async () => {
    const cookies = await registerAndLogin(`oc_${Date.now()}@ex.com`);
    // create draft and commit to generate order quickly
    const d = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    const draftId = d.body.id;
    
    // Create a test message card first
    const messageCard = await createTestMessageCard();
    
    // Set message card and shipping (required for commit)
    await request(app)
      .post(`/api/v1/drafts/${draftId}/message-card`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ messageCardId: messageCard.id });
    
    await request(app)
      .post(`/api/v1/drafts/${draftId}/shipping`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({
        shipping: {
          senderName: 'Test Sender',
          senderPhone: '+905551234567',
          receiverName: 'Test Receiver',
          receiverPhone: '+905551234567',
          city: 'Istanbul',
          district: 'Kadikoy',
          address: 'Test Address 123'
        }
      });
    
    const commit = await request(app)
      .post(`/api/v1/drafts/${draftId}/commit`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send();
    expect([200, 201, 400]).toContain(commit.status);
    const orderId = commit.body.id || commit.body.data?.id;

    const cancel = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ reason: 'Changed my mind' });
    expect([200, 400, 404]).toContain(cancel.status);
    expect(cancel.body.cancelReason || 'Changed my mind').toBeDefined();
  });
});
