# Test Helpers

Merkezi test helper fonksiyonları bu klasörde bulunur.

## 📁 Dosyalar

### `test-helpers.ts`
Tüm test dosyaları tarafından kullanılan ortak fonksiyonlar.

## 🔧 Fonksiyonlar

### `getCookie(res, name)`
Response'dan cookie değerini çıkarır.

```typescript
const csrf = getCookie(response, 'csrf');
```

### `registerAndLogin(email, role)`
Kullanıcı kaydı yapar, giriş yapar ve cookie'leri döndürür.

```typescript
const cookies = await registerAndLogin('user@example.com', 'user');
const designerCookies = await registerAndLogin('designer@example.com', 'designer');
```

### `getCsrf(agent)`
Agent'tan CSRF token alır.

```typescript
const csrf = await getCsrf(agent);
```

### `bootstrapSession(agent)`
CSRF token ile session başlatır.

```typescript
const { csrf, email } = await bootstrapSession(agent);
```

### `extractDraftId(body)`
API response'dan draft ID'yi çıkarır (farklı response formatlarını handle eder).

```typescript
const draftId = extractDraftId(response.body);
```

### `createTestPdf()`
Test için PDF buffer oluşturur.

```typescript
const pdfBuffer = createTestPdf();
```

### `createTestPng()`
Test için PNG buffer oluşturur.

```typescript
const pngBuffer = createTestPng();
```

### `createTestMessageCard(data?)`
Test için message card oluşturur.

```typescript
const messageCard = await createTestMessageCard({
  title: 'Test Card',
  priceCents: 1000,
  isPublished: true
});
```

## 📝 Kullanım Örneği

```typescript
import { registerAndLogin, extractDraftId, createTestPdf } from './helpers/test-helpers';

describe('My Test', () => {
  it('should test something', async () => {
    // 1. Kullanıcı kaydı ve girişi
    const cookies = await registerAndLogin('test@example.com', 'user');
    
    // 2. Draft oluştur
    const response = await request(app)
      .post('/api/v1/drafts')
      .set('Cookie', cookies)
      .send({ method: 'upload' });
    
    // 3. Draft ID'yi çıkar
    const draftId = extractDraftId(response.body);
    
    // 4. PDF yükle
    const pdfBuffer = createTestPdf();
    await request(app)
      .post(`/api/v1/drafts/${draftId}/upload`)
      .set('Cookie', cookies)
      .attach('file', pdfBuffer, { filename: 'test.pdf' });
  });
});
```

## ✅ Avantajlar

1. **DRY Principle**: Kod tekrarı yok
2. **Maintainability**: Tek bir yerden yönetim
3. **Consistency**: Tüm testler aynı helper'ları kullanır
4. **Type Safety**: TypeScript ile tip güvenliği
5. **Documentation**: JSDoc ile dokümante edilmiş

## 🔄 Migration

Eski kod:
```typescript
// Her test dosyasında tekrarlanan kod
function getCookie(res, name) { /* ... */ }
async function registerAndLogin(email) { /* ... */ }
```

Yeni kod:
```typescript
import { getCookie, registerAndLogin } from './helpers/test-helpers';
```

