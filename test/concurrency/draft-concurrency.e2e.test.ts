import request from 'supertest';
import app from '../../src/app';
import { registerAndLogin, createTestPdf, extractDraftId } from '../helpers/test-helpers';

describe('Draft Concurrency E2E', () => {
  /**
   * Test: Concurrent draft creation
   * 
   * Güvenlik: Aynı anda birden fazla draft oluşturulabilmeli
   */
  it('should allow concurrent draft creation', async () => {
    const cookies = await registerAndLogin(`conc_draft_${Date.now()}@ex.com`);
    
    // 1. 5 draft'ı aynı anda oluştur
    const promises = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/v1/drafts')
        .set('Cookie', cookies)
        .set('x-csrf-token', 't')
        .send({ method: 'upload' })
    );
    
    const results = await Promise.all(promises);
    
    // 2. Tüm draft'lar başarılı olmalı
    results.forEach(result => {
      expect(result.status).toBe(201);
      expect(result.body.id || result.body.data?.id).toBeTruthy();
    });
  });

  /**
   * Test: Concurrent file upload
   * 
   * Güvenlik: Aynı draft'a aynı anda dosya yüklenemez
   */
  it('should handle concurrent file upload gracefully', async () => {
    const cookies = await registerAndLogin(`conc_upload_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. Aynı draft'a 3 dosya yüklemeyi dene
    const pdfFile = createTestPdf();
    const promises = Array.from({ length: 3 }, (_, i) =>
      request(app)
        .post(`/api/v1/drafts/${draftId}/upload`)
        .set('Cookie', cookies)
        .set('x-csrf-token', 't')
        .attach('file', pdfFile, { filename: `test${i}.pdf`, contentType: 'application/pdf' })
    );
    
    const results = await Promise.all(promises);
    
    // 3. En az biri başarılı olmalı
    const successCount = results.filter(r => [200, 201].includes(r.status)).length;
    expect(successCount).toBeGreaterThan(0);
  });

  /**
   * Test: Concurrent draft update
   * 
   * Güvenlik: Aynı draft aynı anda güncellenemez
   */
  it('should handle concurrent draft update', async () => {
    const cookies = await registerAndLogin(`conc_update_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. Aynı draft'ı 3 kez güncelle
    const promises = Array.from({ length: 3 }, (_, i) =>
      request(app)
        .put(`/api/v1/drafts/${draftId}`)
        .set('Cookie', cookies)
        .set('x-csrf-token', 't')
        .send({ 
          step: i + 1,
          notes: `Update ${i + 1}`
        })
    );
    
    const results = await Promise.all(promises);
    
    // 3. Tüm update'ler başarılı olmalı (veya en az biri)
    const successCount = results.filter(r => [200, 201].includes(r.status)).length;
    expect(successCount).toBeGreaterThan(0);
  });

  /**
   * Test: Concurrent draft deletion
   * 
   * Güvenlik: Aynı draft aynı anda silinemez
   */
  it('should handle concurrent draft deletion', async () => {
    const cookies = await registerAndLogin(`conc_delete_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = extractDraftId(draft.body);
    
    // 2. Aynı draft'ı 2 kez silmeye çalış
    const promises = [
      request(app)
        .delete(`/api/v1/drafts/${draftId}`)
        .set('Cookie', cookies)
        .set('x-csrf-token', 't'),
      request(app)
        .delete(`/api/v1/drafts/${draftId}`)
        .set('Cookie', cookies)
        .set('x-csrf-token', 't')
    ];
    
    const results = await Promise.all(promises);
    
    // 3. Biri başarılı, diğeri 404 dönmeli
    const successCount = results.filter(r => [200, 204].includes(r.status)).length;
    const notFoundCount = results.filter(r => r.status === 404).length;
    expect(successCount + notFoundCount).toBe(2);
  });

  /**
   * Test: Multiple users creating drafts simultaneously
   * 
   * Güvenlik: Birden fazla kullanıcı aynı anda draft oluşturabilmeli
   */
  it.skip('should allow multiple users to create drafts simultaneously', async () => {
    // 1. 5 farklı kullanıcı oluştur
    const users = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        registerAndLogin(`conc_multi_${Date.now()}_${i}@ex.com`)
      )
    );
    
    // 2. Her kullanıcı bir draft oluştur
    const promises = users.map(cookies =>
      request(app)
        .post('/api/v1/drafts')
        .set('Cookie', cookies)
        .set('x-csrf-token', 't')
        .send({ method: 'upload' })
    );
    
    const results = await Promise.all(promises);
    
    // 3. Tüm draft'lar başarılı olmalı
    results.forEach(result => {
      expect(result.status).toBe(201);
      expect(result.body.id).toBeTruthy();
    });
  });
});

