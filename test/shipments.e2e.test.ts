import request from 'supertest';
import app from '../src/app';
import { bootstrapSession } from './helpers/test-helpers';

describe('Shipments E2E (mock provider)', () => {
  /**
   * SKIPPED TEST - Shipment Workflow
   * 
   * This test is skipped because it requires a complete draft workflow setup:
   * 1. Create draft with upload method
   * 2. Upload file to draft
   * 3. Set message card (required for commit)
   * 4. Set shipping information (required for commit)
   * 5. Commit draft to create order
   * 6. Create shipment for the order
   * 7. List shipments
   * 8. Handle webhook events
   * 
   * To enable this test:
   * - Complete the draft workflow setup
   * - Use createTestMessageCard() helper
   * - Follow the pattern from orders_cancel_reason.e2e.test.ts
   * - Remove .skip from the test
   */
  it.skip('creates order then adds shipment, lists shipments and handles webhook', async () => {
    const agent = request.agent(app);
    const { csrf } = await bootstrapSession(agent);
    expect(csrf).toBeTruthy();

    // Create a draft and commit to create an order
    const draft = await agent.post('/api/drafts').set('X-CSRF-Token', String(csrf)).send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id as string;

    // TODO: Complete workflow
    // 1. Upload file
    // 2. Create and set message card
    // 3. Set shipping info
    // 4. Commit draft
    // 5. Create shipment
    // 6. Test shipment endpoints
    
    expect(draftId).toBeTruthy();
  });
});


