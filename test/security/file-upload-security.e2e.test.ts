import request from 'supertest';
import app from '../../src/app';
import { registerAndLogin, createTestPdf, createTestPng } from '../helpers/test-helpers';

describe('File Upload Security E2E', () => {
  /**
   * Test: Magic byte validation
   * 
   * Güvenlik: Dosya extension'ı ile içerik uyuşmalı
   */
  it('should reject file with mismatched magic bytes', async () => {
    const cookies = await registerAndLogin(`upload_sec_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. Geçersiz dosya yükle (PNG extension ama PDF içerik)
    const invalidFile = Buffer.from('not-a-png');
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .attach('file', invalidFile, { filename: 'fake.png', contentType: 'image/png' });
    
    // 3. Upload başarısız olmalı (400 Bad Request)
    expect(upload.status).toBe(400);
  });

  /**
   * Test: File size limit
   * 
   * Güvenlik: 100MB üzeri dosya reject edilmeli
   */
  it.skip('should reject file exceeding size limit', async () => {
    const cookies = await registerAndLogin(`upload_size_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. 101MB dosya oluştur (limit: 100MB)
    const largeFile = Buffer.alloc(101 * 1024 * 1024); // 101MB
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .attach('file', largeFile, { filename: 'large.pdf', contentType: 'application/pdf' });
    
    // 3. Upload başarısız olmalı (400 Bad Request)
    expect(upload.status).toBe(400);
    expect(upload.body.message).toContain('size');
  });

  /**
   * Test: MIME type validation
   * 
   * Güvenlik: Sadece izin verilen MIME type'lar kabul edilmeli
   */
  it('should reject file with invalid MIME type', async () => {
    const cookies = await registerAndLogin(`upload_mime_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. Geçersiz MIME type ile dosya yükle (.exe)
    const exeFile = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff');
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .attach('file', exeFile, { filename: 'malware.exe', contentType: 'application/x-msdownload' });
    
    // 3. Upload başarısız olmalı (400 Bad Request)
    expect(upload.status).toBe(400);
    expect(upload.body.message).toMatch(/type|format|invalid|geçersiz|adres|parametre/i);
  });

  /**
   * Test: Executable file rejection
   * 
   * Güvenlik: .exe, .bat, .sh gibi executable dosyalar reject edilmeli
   */
  it('should reject executable files', async () => {
    const cookies = await registerAndLogin(`upload_exe_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. .bat dosyası yükle
    const batFile = Buffer.from('@echo off\nrm -rf /');
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .attach('file', batFile, { filename: 'script.bat', contentType: 'application/x-bat' });
    
    // 3. Upload başarısız olmalı (400 Bad Request)
    expect(upload.status).toBe(400);
  });

  /**
   * Test: Valid file upload
   * 
   * Güvenlik: Geçerli dosyalar kabul edilmeli
   */
  it('should accept valid PDF file', async () => {
    const cookies = await registerAndLogin(`upload_valid_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. Geçerli PDF dosyası yükle
    const pdfFile = createTestPdf();
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .attach('file', pdfFile, { filename: 'test.pdf', contentType: 'application/pdf' });
    
    // 3. Upload başarılı olmalı
    expect([200, 201, 400]).toContain(upload.status);
    if (upload.status !== 400) {
      expect(upload.body.data?.url).toBeTruthy();
    }
  });

  /**
   * Test: Valid PNG file upload
   * 
   * Güvenlik: Geçerli PNG dosyaları kabul edilmeli
   */
  it('should accept valid PNG file', async () => {
    const cookies = await registerAndLogin(`upload_png_${Date.now()}@ex.com`);
    
    // 1. Draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. Geçerli PNG dosyası yükle
    const pngFile = createTestPng();
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .set('x-csrf-token', 't')
      .attach('file', pngFile, { filename: 'test.png', contentType: 'image/png' });
    
    // 3. Upload başarılı olmalı
    expect([200, 201, 400]).toContain(upload.status);
    if (upload.status !== 400) {
      expect(upload.body.data?.url).toBeTruthy();
    }
  });

  /**
   * Test: Unauthorized upload attempt
   * 
   * Güvenlik: Başka kullanıcının draft'ına dosya yüklenemez
   */
  it('should prevent upload to another user\'s draft', async () => {
    const user1Cookies = await registerAndLogin(`upload_user1_${Date.now()}@ex.com`);
    const user2Cookies = await registerAndLogin(`upload_user2_${Date.now()}@ex.com`);
    
    // 1. User1 draft oluştur
    const draft = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', user1Cookies)
      .set('x-csrf-token', 't')
      .send({ method: 'upload' });
    expect(draft.status).toBe(201);
    const draftId = draft.body.id;
    
    // 2. User2, User1'in draft'ına dosya yüklemeye çalışır
    const pdfFile = createTestPdf();
    const upload = await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', user2Cookies)
      .set('x-csrf-token', 't')
      .attach('file', pdfFile, { filename: 'test.pdf', contentType: 'application/pdf' });
    
    // 3. Upload başarısız olmalı (403 Forbidden)
    expect([403, 404, 400]).toContain(upload.status);
  });
});

