# 🎨 Polikrami Cover Backend

TypeScript + Express + PostgreSQL (Prisma) backend API for Polikrami Cover platform.

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Stack](#teknik-stack)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Geliştirme](#geliştirme)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Güvenlik](#güvenlik)
- [Docker](#docker)
- [Test](#test)
- [Deployment](#deployment)

## ✨ Özellikler

- 🔐 **Kimlik Doğrulama**: JWT (Access + Refresh tokens), email/phone verification
- 💳 **Ödeme Sistemi**: Iyzico entegrasyonu, payment callbacks, webhook signature verification
- 📦 **Sipariş Yönetimi**: Order lifecycle, payment tracking, invoice generation
- 🚚 **Kargo Takibi**: Shipment tracking, carrier integration, webhook support
- 🤖 **AI Entegrasyonu**: AI image generation with credit system, job queue (BullMQ)
- 🎨 **Tasarım Yönetimi**: Draft workflow, designer assignment, revision system
- 💰 **Kredi Sistemi**: Credit wallet, transaction ledger, welcome bonuses
- 📝 **İletişim**: Contact form, email queue, notifications
- 🔍 **Arama**: Full-text search, category/tag filtering
- 📊 **Analytics**: Prometheus metrics, logging (Pino)

## 🛠 Teknoloji Stack

- **Runtime**: Node.js 20+, TypeScript 5.5+
- **Framework**: Express 4.x
- **Database**: PostgreSQL 15+ (Prisma ORM)
- **Queue**: BullMQ + Redis (AI jobs)
- **Validation**: Zod
- **Security**: Helmet, CORS, CSRF protection, Rate limiting
- **Logging**: Pino
- **Monitoring**: Prometheus, Sentry
- **File Processing**: Multer, Sharp
- **Payment**: Iyzico integration

## 📦 Gereksinimler

- Node.js >= 20
- PostgreSQL >= 15
- Redis (AI queue için - opsiyonel)
- npm veya yarn

## 🚀 Kurulum

### 1. Repository'yi klonlayın

```bash
git clone <repository-url>
cd polikrami-cover-backend
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Environment değişkenlerini ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun:

```bash
cp ENV.EXAMPLE .env
```

Önemli değişkenler:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Access token için secret key (min 32 karakter)
- `JWT_REFRESH_SECRET`: Refresh token için secret key (min 32 karakter)
- `REDIS_URL`: Redis connection string (AI queue için)
- `SMTP_*`: Email gönderimi için SMTP ayarları
- `PAYMENT_PROVIDER`: `mock` veya `iyzico`
- `IYZICO_API_KEY` / `IYZICO_SECRET_KEY`: Iyzico entegrasyonu için

### 4. Database kurulumu

```bash
# Prisma client generate
npm run prisma:generate

# Database migrations
npm run prisma:migrate

# (Opsiyonel) Location data seed
npm run db:seed:locations
```

### 5. Build

```bash
npm run build
```

### 6. Development modunda çalıştırın

```bash
npm run dev
```

API http://localhost:3000 adresinde çalışacaktır.

## 💻 Geliştirme

### Temel Komutlar

```bash
# Development server (watch mode)
npm run dev

# Production build
npm run build

# Production start
npm run start

# Linting
npm run lint

# Format code
npm run format

# Prisma Studio (Database GUI)
npm run prisma:studio
```

### Test Komutları

```bash
# Tüm testler
npm run test

# Unit testler
npm run test:unit

# Integration testler
npm run test:integration

# E2E testler
npm run test:e2e

# Test coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Utility Scripts

```bash
# Email queue cleanup
npm run cleanup:email-queue

# AI temporary files cleanup
npm run cleanup:ai-tmp
```

## 📚 API Dokümantasyonu

### Base URL

```
http://localhost:3000/api/v1
```

### Önemli Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Kullanıcı kaydı
- `POST /api/v1/auth/login` - Giriş
- `POST /api/v1/auth/refresh` - Token yenileme
- `POST /api/v1/auth/forgot-password` - Şifre sıfırlama
- `POST /api/v1/auth/reset-password` - Şifre sıfırlama onayı

#### Orders & Payments
- `POST /api/v1/payments/initiate` - Ödeme başlatma
- `POST /api/v1/payments/callback` - Payment webhook (Iyzico)
- `GET /api/v1/orders` - Sipariş listesi
- `GET /api/v1/orders/:id` - Sipariş detayı

#### Drafts & AI
- `POST /api/v1/drafts` - Yeni draft oluştur
- `POST /api/v1/ai/generate/:draftId` - AI ile görsel üret
- `GET /api/v1/drafts/:id` - Draft detayı

#### Addresses
- `GET /api/v1/addresses` - Adres listesi
- `POST /api/v1/addresses` - Yeni adres ekle
- `PUT /api/v1/addresses/:id` - Adres güncelle

#### Shipments
- `GET /api/v1/shipments/order/:orderId` - Sipariş kargoları
- `POST /api/v1/shipments/webhook/:provider` - Kargo webhook

Detaylı API dokümantasyonu için:
- Swagger UI: http://localhost:3000/docs (eğer yapılandırıldıysa)
- `API_DOCS.html` dosyasına bakın

## 🔒 Güvenlik

### CSRF Protection

State-changing isteklerde (`POST`, `PUT`, `DELETE`, `PATCH`) CSRF token gerekir:

1. `GET /csrf` endpoint'inden token alın
2. Her istekte `X-CSRF-Token` header'ına cookie'deki `csrf` değerini gönderin

```javascript
// Örnek fetch
const csrfToken = document.cookie.match(/csrf=([^;]+)/)?.[1];
fetch('/api/v1/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});
```

### Rate Limiting

- **Global**: 60 requests/minute
- **Email Verification**: 3 requests/hour
- **Password Reset**: 3 requests/hour
- **Phone Verification**: 5 requests/hour

### Authentication

JWT token'lar cookie'de saklanır:
- `access`: Access token (15 dakika)
- `refresh`: Refresh token (30 gün)

Bearer token ile de kullanılabilir:
```
Authorization: Bearer <access_token>
```

### Webhook Security

Payment ve shipment webhook'ları signature verification ile korunur:
- Iyzico: HMAC SHA256 signature verification
- Shipment providers: Provider-specific signature verification

## 🐳 Docker

### Docker Compose ile çalıştırma

```bash
docker compose up --build
```

Bu komut:
- PostgreSQL container'ı başlatır
- API container'ı build eder ve çalıştırır
- Database migrations otomatik çalışır
- Health check yapılır

### Manuel Docker build

```bash
# Build image
docker build -t coverpolikrami-backend .

# Run container
docker run -p 3000:3000 --env-file .env coverpolikrami-backend
```

### Volume Mounts

- `./uploads` → `/app/uploads` (File uploads kalıcı olur)

## 🧪 Test

Proje kapsamlı test suite'i içerir:

- **Unit Tests**: `test/unit/`
- **Integration Tests**: `test/integration/`
- **E2E Tests**: `test/*.e2e.test.ts`
- **Security Tests**: `test/security/`
- **Performance Tests**: `test/performance/`

Test çalıştırma:

```bash
# Tüm testler
npm run test

# Coverage raporu
npm run test:coverage

# Belirli test dosyası
npm run test -- test/auth.e2e.test.ts
```

## 🚢 Deployment

### Production Checklist

- [ ] `.env` dosyası production değerleriyle dolduruldu
- [ ] `NODE_ENV=production` ayarlandı
- [ ] `COOKIE_SECURE=true` ayarlandı
- [ ] `COOKIE_DOMAIN` production domain'e ayarlandı
- [ ] `ALLOWED_ORIGINS` frontend URL'leriyle güncellendi
- [ ] Database migrations çalıştırıldı: `npm run prisma:deploy`
- [ ] SSL/TLS sertifikaları yapılandırıldı
- [ ] Redis production için yapılandırıldı (AI queue için)
- [ ] Payment provider credentials doğrulandı (Iyzico)

### Environment Variables (Production)

```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
COOKIE_SECURE=true
COOKIE_DOMAIN=.yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_ACCESS_SECRET=<strong-random-32-chars>
JWT_REFRESH_SECRET=<strong-random-32-chars>
REDIS_URL=redis://redis-host:6379
PAYMENT_PROVIDER=iyzico
IYZICO_API_KEY=<your-key>
IYZICO_SECRET_KEY=<your-secret>
```

### Docker Deployment

```bash
# Production build
docker build -t coverpolikrami-backend:latest .

# Run with production env
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name coverpolikrami-api \
  coverpolikrami-backend:latest
```

### Database Migrations (Production)

```bash
# Production'da migration deploy kullanın (dev yerine)
npm run prisma:deploy
```

## 📁 Proje Yapısı

```
polikrami-cover-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── http/            # HTTP routes
│   ├── middlewares/     # Express middlewares
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── payments/    # Payment processing
│   │   ├── orders/      # Order management
│   │   ├── drafts/      # Draft workflow
│   │   ├── ai/          # AI generation
│   │   └── ...
│   ├── shared/          # Shared utilities
│   ├── services/        # External services
│   ├── queue/           # BullMQ queues & workers
│   └── utils/           # Helper functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
├── test/                # Test files
├── dist/                # Compiled TypeScript (build output)
└── uploads/             # File uploads directory
```

## 🔧 Sorun Giderme

### Database Connection Error

```bash
# Database bağlantısını test edin
npm run prisma:studio

# Prisma client'ı yeniden generate edin
npm run prisma:generate
```

### Build Hataları

```bash
# TypeScript cache'i temizleyin
rm -rf dist tsconfig.tsbuildinfo

# Yeniden build
npm run build
```

### Redis Connection (AI Queue)

Redis yoksa AI queue çalışmaz ancak API normal çalışır. Redis olmadan:
- AI generation işleri queue'ya alınamaz
- Worker başlamaz (hata vermez, sadece warning)

## 📝 Notlar

- CSRF token'ı almak için `GET /csrf` endpoint'ini kullanın
- Payment webhook'ları signature verification ile korunur
- File uploads `/uploads` dizininde saklanır
- AI generation işleri Redis + BullMQ ile async çalışır
- Rate limiting Redis kullanıyorsa daha iyi performans gösterir

## 📄 Lisans

Private project - All rights reserved

## 👥 Katkıda Bulunma

Bu proje private bir projedir. Sorularınız için iletişime geçin.

---

**Versiyon**: 0.1.0  
**Son Güncelleme**: 2025-01-27
