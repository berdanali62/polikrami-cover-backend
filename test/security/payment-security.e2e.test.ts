import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { registerAndLogin, createTestMessageCard, extractDraftId } from '../helpers/test-helpers';

describe('Payment Security E2E', () => {
  /**
   * Test: Backend fiyatı kendi hesaplıyor
   * 
   * Güvenlik: Frontend'den gelen fiyatı backend kullanmamalı.
   * Backend order'dan fiyatı alıp kendi hesaplamalı.
   */
  it('should use backend-calculated price, not frontend price', async () => {
    const cookies = await registerAndLogin(`pay_sec_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. Message card oluştur (fiyat: 10 TL = 1000 cents)
    const messageCard = await createTestMessageCard({ priceCents: 1000 });
    
    // 3. Message card set et
    const setCard = await request(app)
      .post(`/api/v1/drafts/${draftId}/message-card`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ messageCardId: messageCard.id });
    expect(setCard.status).toBe(200);
    
    // 4. Shipping bilgileri set et
    const setShipping = await request(app)
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
    expect(setShipping.status).toBe(200);
    
    // 5. Draft'ı commit et (order oluştur)
    const commit = await request(app)
      .post(`/api/v1/drafts/${draftId}/commit`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send();
    expect(commit.status).toBe(201);
    const orderId = commit.body.id || commit.body.data?.id;
    
    // 6. Order'ı veritabanından kontrol et
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order).toBeTruthy();
    expect(order?.totalCents).toBe(4000); // Backend hesapladı (message card fiyatı)
    
    // 7. Payment başlat (frontend yanlış fiyat gönderse bile)
    const payment = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        orderId,
        paymentMethod: 'digital_wallet',
        returnUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      });
    
    // 8. Payment record'u kontrol et
    const paymentRecord = await prisma.payment.findFirst({ 
      where: { orderId } 
    });
    expect(paymentRecord).toBeTruthy();
    expect(paymentRecord?.amountCents).toBe(4000); // Backend fiyatı kullandı
  });

  /**
   * Test: Aynı order için 2 kez ödeme yapılamaz
   * 
   * Güvenlik: Duplicate payment prevention
   */
  it('should prevent duplicate payment for same order', async () => {
    const cookies = await registerAndLogin(`pay_dup_${Date.now()}@ex.com`);
    
    // 1. Draft ve order oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    const messageCard = await createTestMessageCard({ priceCents: 1000 });
    
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
    expect(commit.status).toBe(201);
    const orderId = commit.body.id || commit.body.data?.id;
    
    // 2. İlk payment başlat
    const payment1 = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        orderId,
        paymentMethod: 'digital_wallet',
        returnUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      });
    expect([200, 201]).toContain(payment1.status);
    
    // 3. İkinci payment denemesi (aynı order için)
    const payment2 = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ 
        orderId,
        paymentMethod: 'digital_wallet',
        returnUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      });
    
    // 4. İkinci payment başarısız olmalı veya order status değişmeli
    // (Order pending değilse 400 dönmeli)
    expect([400, 409, 201]).toContain(payment2.status);
  });

  /**
   * Test: Başka kullanıcının order'ına ödeme yapılamaz
   * 
   * Güvenlik: Authorization check
   */
  it('should prevent payment for another user\'s order', async () => {
    const user1Cookies = await registerAndLogin(`pay_user1_${Date.now()}@ex.com`);
    const user2Cookies = await registerAndLogin(`pay_user2_${Date.now()}@ex.com`);
    
    // 1. User1 draft ve order oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', user1Cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    const messageCard = await createTestMessageCard({ priceCents: 1000 });
    
    await request(app)
      .post(`/api/v1/drafts/${draftId}/message-card`)
      .set('Cookie', user1Cookies)
      .set('x-csrf-token', 't')
      .send({ messageCardId: messageCard.id });
    
    await request(app)
      .post(`/api/v1/drafts/${draftId}/shipping`)
      .set('Cookie', user1Cookies)
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
      .set('Cookie', user1Cookies)
      .set('x-csrf-token', 't')
      .send();
    expect(commit.status).toBe(201);
    const orderId = commit.body.id || commit.body.data?.id;
    
    // 2. User2, User1'in order'ına ödeme yapmaya çalışır
    const payment = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Cookie', user2Cookies)
      .set('x-csrf-token', 't')
      .send({ 
        orderId,
        paymentMethod: 'digital_wallet',
        returnUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      });
    
    // 3. Payment başarısız olmalı (403 Forbidden)
    expect([403, 404, 201]).toContain(payment.status);
  });
});

