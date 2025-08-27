# CoverPolikrami API Test Rehberi

## 🚀 Hızlı Başlangıç

### 1. Postman Kurulumu
1. Postman'i indir ve kur
2. Collection'ı import et: `CoverPolikrami-Complete-Tests.postman_collection.json`
3. Environment'ı import et: `CoverPolikrami-Environment.postman_environment.json`
4. Environment'ı seç (sağ üst köşeden)

### 2. Sunucuyu Başlat
```bash
cd coverPolikrami-backend
npm run dev
```

### 3. Veritabanını Hazırla
```bash
# Migration'ları çalıştır
npx prisma migrate deploy

# (Opsiyonel) Test verisi ekle
npx prisma db seed
```

## 📋 Test Senaryoları

### Senaryo 1: Tam Kullanıcı Akışı
**Sıralı çalıştır:**
1. `0. Setup & Health Checks` → `Health Check`
2. `0. Setup & Health Checks` → `Get CSRF Token`
3. `1. Authentication` → `Register User`
4. `1. Authentication` → `Login User`
5. `2. User Management` → `Get My Profile`
6. `3. Projects` → `Create Project`
7. `4. Drafts` → `Create Draft`
8. `4. Drafts` → `Update Draft`
9. `4. Drafts` → `Set Shipping Info`
10. `4. Drafts` → `Commit Draft (Create Order)`
11. `5. Orders` → `List My Orders`

### Senaryo 2: Designer Akışı
**Sıralı çalıştır:**
1. `1. Authentication` → `Register Designer`
2. `1. Authentication` → `Login User` (designer credentials ile)
3. `6. Message Cards & Designers` → `List Designers`
4. `4. Drafts` → `Assign Designer`

### Senaryo 3: Güvenlik Testleri
**Ayrı ayrı çalıştır:**
1. `8. Error Cases` → `Unauthorized Access Test`
2. `8. Error Cases` → `CSRF Protection Test`
3. `8. Error Cases` → `Invalid Data Test`
4. `8. Error Cases` → `Rate Limiting Test`

## 🔧 Manuel Test Örnekleri

### Authentication Testleri

#### ✅ Geçerli Kayıt
```json
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "confirmPassword": "Test123!@#",
  "name": "Test User",
  "role": "user"
}
```

#### ❌ Geçersiz Kayıt (Zayıf Şifre)
```json
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "123",
  "confirmPassword": "123",
  "name": "Test User"
}
```

#### ✅ Giriş Yapma
```json
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "remember": false
}
```

### Draft Testleri

#### ✅ Draft Oluşturma
```json
POST /api/drafts
{
  "method": "upload"
}
```

#### ✅ Draft Güncelleme
```json
PUT /api/drafts/{draftId}
{
  "step": 2,
  "data": {
    "title": "Kitap Başlığı",
    "author": "Yazar Adı",
    "genre": "Roman",
    "description": "Kitap açıklaması..."
  }
}
```

#### ✅ Kargo Bilgileri Ekleme
```json
POST /api/drafts/{draftId}/shipping
{
  "shipping": {
    "senderName": "Gönderen Adı",
    "senderPhone": "+90 555 123 4567",
    "receiverName": "Alıcı Adı",
    "receiverPhone": "+90 555 765 4321",
    "city": "İstanbul",
    "district": "Kadıköy",
    "address": "Tam adres bilgisi...",
    "company": "Şirket Adı (opsiyonel)"
  }
}
```

### Order Testleri

#### ✅ Sipariş Durumu Güncelleme (Test Ortamı)
```json
PUT /api/orders/{orderId}/status
{
  "status": "paid"
}
```

Mevcut durumlar: `pending`, `paid`, `failed`, `canceled`, `refunded`

### Contact Testleri

#### ✅ İletişim Mesajı Gönderme
```json
POST /api/contact
{
  "name": "İsim Soyisim",
  "email": "email@example.com",
  "phone": "+90 555 123 4567",
  "message": "Merhaba, kitap tasarım hizmetleriniz hakkında bilgi almak istiyorum..."
}
```

## 🧪 Otomatik Test Çalıştırma

### Collection Runner ile Tam Test
1. Postman'de collection'a sağ tık
2. "Run collection" seç
3. Tüm testleri seç
4. "Run" buton'una bas
5. Sonuçları izle

### Newman ile CLI Test
```bash
# Newman'ı kur
npm install -g newman

# Collection'ı çalıştır
newman run CoverPolikrami-Complete-Tests.postman_collection.json \
  -e CoverPolikrami-Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html
```

## 🔍 Debugging İpuçları

### 1. CSRF Token Sorunları
- Her yeni session'da önce `/csrf` endpoint'ini çağır
- `X-CSRF-Token` header'ını doğru set et
- Cookie'lerin set edildiğinden emin ol

### 2. Authentication Sorunları
- Login sonrası cookie'lerin set edildiğini kontrol et
- Token'ların doğru format'ta olduğunu kontrol et
- Token süresi dolmuşsa refresh endpoint'ini kullan

### 3. Validation Hataları
- Request body'nin doğru format'ta olduğunu kontrol et
- Required field'ların eksik olmadığını kontrol et
- Email formatının geçerli olduğunu kontrol et

### 4. Database Sorunları
- PostgreSQL'in çalıştığından emin ol
- Migration'ların uygulandığından emin ol
- Test verilerinin mevcut olduğunu kontrol et

## 📊 Test Metrikleri

### Başarılı Response Kodları
- `200` - OK (GET, PUT)
- `201` - Created (POST)
- `204` - No Content (DELETE)

### Hata Response Kodları
- `400` - Bad Request (Validation hataları)
- `401` - Unauthorized (Authentication gerekli)
- `403` - Forbidden (CSRF, yetki sorunları)
- `404` - Not Found (Kaynak bulunamadı)
- `409` - Conflict (Email zaten mevcut)
- `429` - Too Many Requests (Rate limiting)
- `500` - Internal Server Error

## 🚨 Güvenlik Test Kontrolleri

### ✅ Kontrol Edilecek Güvenlik Özellikleri
- [ ] CSRF koruması çalışıyor mu?
- [ ] Rate limiting çalışıyor mu?
- [ ] Authentication gerekli endpoint'ler korumalı mı?
- [ ] Input validation çalışıyor mu?
- [ ] SQL injection koruması var mı?
- [ ] XSS koruması var mı?
- [ ] Sensitive data loglanmıyor mu?

### 🔧 Performance Test Kontrolleri
- [ ] Response time'lar 5 saniyenin altında mı?
- [ ] Database query'leri optimize mi?
- [ ] Memory leak yok mu?
- [ ] Concurrent request'ler doğru handle ediliyor mu?

## 📝 Test Sonuçları Raporlama

Test sonuçlarını aşağıdaki formatta kaydet:

```
Test Date: [YYYY-MM-DD]
Environment: [Development/Staging/Production]
Total Tests: [X]
Passed: [X]
Failed: [X]
Skipped: [X]

Failed Tests:
- Test Name: Reason
- Test Name: Reason

Performance:
- Average Response Time: [X]ms
- Slowest Endpoint: [endpoint] - [X]ms
```

## 🔄 CI/CD Integration

GitHub Actions için örnek workflow:

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run API tests
        run: |
          npm run dev &
          sleep 10
          newman run postman/CoverPolikrami-Complete-Tests.postman_collection.json \
            -e postman/CoverPolikrami-Environment.postman_environment.json \
            --reporters junit,cli
```

## 🎯 İleri Seviye Test Teknikleri

### Load Testing
```bash
# Artillery ile load test
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:3000/health
```

### Security Testing
```bash
# OWASP ZAP ile güvenlik tarama
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

Bu rehberi takip ederek API'nin tüm özelliklerini kapsamlı şekilde test edebilirsin! 🚀
