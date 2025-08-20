# coverPolikrami Backend

TypeScript + Express + PostgreSQL (Prisma) backend.

## Geliştirme

1) .env oluşturun (`.env.example` referans).  
2) Bağımlılıklar: `npm install`  
3) Prisma client: `npm run prisma:generate`  
4) Migrasyon: `npm run prisma:migrate`  
5) Çalıştır: `npm run dev`

### Auth Uçları (Doğrulamasız kayıt, 4 haneli reset kodu)
- POST `/api/auth/forgot-password` { email }
- POST `/api/auth/verify-reset-code` { email, code(4-digit) }
- POST `/api/auth/reset-password` { email, code(4-digit), password }

Not: CSRF için state-changing isteklerde `X-CSRF-Token` header'ını, `csrf` cookie değeri ile eşit göndermelisiniz.

## Docker

```
docker compose up --build
```

API: http://localhost:3000/health

Yüklemelerin kalıcı olması için `uploads` klasörü volume olarak mount edilir (compose içinde tanımlı).


