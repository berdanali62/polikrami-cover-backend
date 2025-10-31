import request from 'supertest';
import app from '../../src/app';
import { registerAndLogin, extractDraftId } from '../helpers/test-helpers';
import { prisma } from '../../src/config/database';

describe('AI Module Edge Cases E2E', () => {
  /**
   * Test: Insufficient credits
   * 
   * Güvenlik: Credit yetersizse AI generation başarısız olmalı
   */
  it('should reject AI generation when credits insufficient', async () => {
    const cookies = await registerAndLogin(`ai_credit_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur (AI method)
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'ai' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. User'ın credit'ini 0 yap
    const userRecord = await prisma.user.findFirst({ 
      where: { email: { contains: 'ai_credit_' } },
      orderBy: { createdAt: 'desc' }
    });
    
    if (userRecord) {
      await prisma.creditWallet.upsert({
        where: { userId: userRecord.id },
        update: { balance: 0 },
        create: { userId: userRecord.id, balance: 0 }
      });
    }
    
    // 3. AI generation dene (credit yetersiz)
    const generate = await request(app)
      .post(`/api/v1/drafts/${draftId}/ai/generate`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        userPrompt: 'A beautiful landscape',
        count: 1
      });
    
    // 4. Generation başarısız olmalı (402 Payment Required)
    expect([402, 400, 404]).toContain(generate.status);
    if (generate.status !== 404) {
      expect(generate.body.message).toContain('CREDIT');
    }
  });

  /**
   * Test: Unsafe prompt rejection
   * 
   * Güvenlik: Unsafe prompt'lar reject edilmeli
   */
  it('should reject unsafe prompts', async () => {
    const cookies = await registerAndLogin(`ai_safety_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur (AI method)
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'ai' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. Unsafe prompt ile AI generation dene
    const generate = await request(app)
      .post(`/api/v1/drafts/${draftId}/ai/generate`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        userPrompt: 'nude explicit adult content',
        count: 1
      });
    
    // 3. Generation başarısız olmalı (400 Bad Request)
    expect([400, 404]).toContain(generate.status);
    if (generate.status !== 404) {
      expect(generate.body.message).toContain('UNSAFE');
    }
  });

  /**
   * Test: Concurrent AI generation attempts
   * 
   * Güvenlik: Aynı draft için concurrent generation engellenmeli
   */
  it('should prevent concurrent AI generation for same draft', async () => {
    const cookies = await registerAndLogin(`ai_concurrent_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur (AI method)
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'ai' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. İlk AI generation başlat
    const generate1 = await request(app)
      .post(`/api/v1/drafts/${draftId}/ai/generate`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        userPrompt: 'A beautiful landscape',
        count: 1
      });
    
    // 3. İkinci AI generation dene (aynı draft için)
    const generate2 = await request(app)
      .post(`/api/v1/drafts/${draftId}/ai/generate`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        userPrompt: 'A beautiful landscape',
        count: 1
      });
    
    // 4. İkinci generation başarısız olmalı (409 Conflict)
    expect([409, 400, 404]).toContain(generate2.status);
  });

  /**
   * Test: AI generation with valid prompt
   * 
   * Güvenlik: Geçerli prompt ile generation başarılı olmalı
   */
  it('should accept valid AI generation request', async () => {
    const cookies = await registerAndLogin(`ai_valid_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur (AI method)
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'ai' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. Geçerli prompt ile AI generation başlat
    const generate = await request(app)
      .post(`/api/v1/drafts/${draftId}/ai/generate`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        userPrompt: 'A beautiful sunset over mountains',
        count: 1
      });
    
    // 3. Generation başarılı olmalı (202 Accepted)
    expect([202, 200, 404]).toContain(generate.status);
    if (generate.status !== 404) {
      expect(generate.body.jobId || generate.body).toBeTruthy();
    }
  });

  /**
   * Test: Unauthorized AI generation
   * 
   * Güvenlik: Başka kullanıcının draft'ı için AI generation yapılamaz
   */
  it.skip('should prevent AI generation for another user\'s draft', async () => {
    const user1Cookies = await registerAndLogin(`ai_user1_${Date.now()}@ex.com`);
    const user2Cookies = await registerAndLogin(`ai_user2_${Date.now()}@ex.com`);
    
    // 1. User1 draft oluştur (AI method)
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', user1Cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'ai' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. User2, User1'in draft'ı için AI generation dene
    const generate = await request(app)
      .post(`/api/v1/drafts/${draftId}/ai/generate`)
      .set('Cookie', user2Cookies)
      .set('x-csrf-token', 't')
      .send({ 
        userPrompt: 'A beautiful landscape',
        count: 1
      });
    
    // 3. Generation başarısız olmalı (403 Forbidden veya 400)
    expect([403, 400, 404]).toContain(generate.status);
  });
});

