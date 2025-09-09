## Polikrami Cover Backend — Architecture Overview

### 1) Purpose and Scope
- API for user auth, orders/payments, asset uploads, AI image generation, and notifications
- Modular design per domain; secure by default; production-ready tooling

### 2) Technology Stack
- Runtime: Node.js (TypeScript), Express
- Data: PostgreSQL via Prisma ORM
- Queue/Background: BullMQ + Redis (AI jobs)
- Validation: Zod
- Security: Helmet, CORS allowlist, CSRF double-submit, JWT
- Logging: pino
- Files/Images: multer + sharp
- Payments: iyzico integration
- Tests: Jest + Supertest (E2E)
- Deployment: Docker, Nginx

### 3) High-Level Architecture
- Clients (Web/SPA) → HTTP/JSON API → Express middlewares → Route handlers → Services/Repositories → Prisma/PostgreSQL
- Background AI pipeline: API enqueues job → BullMQ Worker renders → results stored (GeneratedImage)
- Email pipeline: EmailQueue records → worker/script sender → cleanups

### 4) Module Map (Selected)
- Auth: register/login/refresh/reset/verify; argon2id password hashing
- Users: profiles/update password
- Projects/Comments: collaboration primitives
- Drafts/AI: AI image generation flow with credits
- Wallet: credits ledger (wallet + transactions)
- Orders/Payments/Invoices: order lifecycle, providers (mock/iyzico)
- Templates/Categories/Tags: content taxonomy
- Assets: file upload + static serving (public)
- Notifications/Email: user messages and queued emails

### 5) Security by Design
- Helmet security headers; CORS allowlist per ENV
- CSRF: double-submit cookie/header check for state-changing requests
- Rate limiting on sensitive endpoints
- JWT auth (access/refresh), role checks in middleware
- argon2id hashing with random salt per password

### 6) Data Model Highlights (Prisma)
- Users with roles and tokens (refresh/reset/verify)
- Orders with items, payments, invoice
- Drafts ↔ AiJob ↔ GeneratedImage
- CreditWallet and CreditTransaction ledger
- Organizations, Projects, Comments; Templates, Categories, Tags

### 7) Observability & Quality
- Structured logs via pino; Prisma query events (dev)
- E2E tests cover auth, designers, payments, AI, smoke/full
- OpenAPI YAML and Postman collections for API docs

### 8) Deployment & Runtime
- Docker images; Nginx as reverse proxy
- ENV validated via Zod at startup
- Graceful shutdown: HTTP close + Prisma disconnect

### 9) Performance Considerations
- Indexed queries via Prisma migrations
- Background processing for CPU/network heavy AI tasks
- Static public uploads served with cache headers

### 10) Risks & Mitigations
- Payment webhooks: CSRF bypass but signature/validation enforced in service
- Upload security: MIME/size constraints, private/public separation
- Production logging: reduce query logs; keep error/warn

### 11) Quick Pitches to Leadership
- Modern, modular, and secure backend with clear domain boundaries
- Scalable via stateless API + Redis/DB; background workers for heavy tasks
- Strong test coverage and environment validation reduce regressions


