## Polikrami Cover Backend — Production Runbook

This runbook helps engineers triage incidents and operate the service.

### 0) TL;DR — Where to Look First
- Logs: pino app logs; check reverse proxy (Nginx) and worker logs
- Health: `GET /health` → 200 OK expected
- ENV: `src/config/env.ts` schema; ensure all required keys are present
- Queue: Redis connectivity; AI worker running; BullMQ failure counts
- DB: PostgreSQL reachable; Prisma migrations applied

### 1) Startup & Shutdown
- Entrypoint: `src/index.ts`
  - Creates HTTP server, listens on `env.PORT`
  - Handles `SIGTERM/SIGINT` for graceful shutdown: HTTP close → Prisma disconnect
- Common startup failures:
  - Missing/invalid ENV (Zod throws)
  - DB connectivity issues (DATABASE_URL)
  - Redis not reachable (if AI/queue enabled)

### 2) Configuration
- Location: `src/config/env.ts`
- Action: Validate ENV; fix `.env`/secrets; re-deploy
- Keys to verify quickly:
  - `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `ALLOWED_ORIGINS`, `COOKIE_SECURE`, SMTP settings
  - `PAYMENT_PROVIDER`, Iyzico credentials
  - `REDIS_URL`, `STABILITY_API_KEY` (AI)

### 3) Authentication Issues
- Symptoms: 401/403 from protected endpoints
- Checks:
  - Access token cookie/header present and valid (`middlewares/auth.ts`)
  - Clock skew/expiry (ACCESS_EXPIRES_IN); refresh flow works
  - CSRF double-submit for state-changing requests (header `x-csrf-token` matches cookie)
- Recovery:
  - Re-login to obtain fresh tokens
  - Check CORS/credentials configuration if cookies are missing

### 4) CSRF/CORS Failures
- 403 CSRF: Ensure header `x-csrf-token` equals `csrf` cookie value; exceptions: `/api/auth/refresh`, `/api/payments/callback`
- CORS blocked: Add origin to `ALLOWED_ORIGINS` (comma-separated) and redeploy

### 5) Database & Prisma
- Connection: `src/config/database.ts` (`PrismaClient`)
- Query logging (dev): noisy; reduce in prod to warn/error
- Migrations: `prisma/migrations/*` applied via CI/CD or `prisma migrate deploy`
- If schema drift suspected: run `prisma migrate status`

### 6) Payments (Iyzico)
- Symptoms: payment init fails, callbacks not updating orders
- Checks:
  - Provider base URL: sandbox vs prod
  - API keys present; network to provider
  - Callback endpoint reachable from provider; check proxy ingress rules
- Data:
  - `Order`, `Payment`, `Invoice` tables for latest changes
  - Reconcile payment status with provider dashboard

### 7) AI Generation Pipeline
- Flow: API enqueues `AiJob` → BullMQ worker renders → saves `GeneratedImage`
- Symptoms: jobs stuck in `queued` or failing
- Checks:
  - Redis up (`REDIS_URL`)
  - Worker process running (`src/queue/ai.worker.ts`)
  - Stability API key present; network egress allowed
  - Disk space in `uploads` dirs; watermarking errors (sharp)
- Data:
  - `AiJob.status`, `error`, timestamps
  - `GeneratedImage` entries and file paths

### 8) Email Delivery
- Path: `src/shared/email/*`, queue records in `EmailQueue`
- Symptoms: emails not delivered, retries piling up
- Checks:
  - SMTP credentials and TLS flags in ENV
  - Network to SMTP host/port
  - Email queue cleanup scripts

### 9) Assets / Uploads
- Public served at `/uploads` (read-only)
- Issues: 404/403 or MIME errors
- Checks:
  - Upload dirs exist; permissions; disk space
  - `UPLOAD_ALLOWED_MIME` and size limits

### 10) Rate Limiting & Abuse
- Sudden 429 responses → check `middlewares/rateLimit.ts`
- Tune limits for auth/contact endpoints if necessary

### 11) Observability
- Logs: parse pino JSON (pretty in dev)
- Consider adding metrics (Prometheus) and tracing if needed

### 12) Security Notes
- Passwords: argon2id with per-user random salt
- JWT secrets rotation plan recommended
- Ensure production CORS and cookie flags (`COOKIE_SECURE=true` behind HTTPS)

### 13) Disaster Recovery
- Backups: DB snapshots/point-in-time restore (infrastructure level)
- Secrets: store in secret manager; rotate on incident
- Rollback: previous image + `prisma migrate deploy` with care

### 14) Common Run Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Tests: `npm test`
- Prisma: `npm run prisma:migrate`, `npm run prisma:deploy`, `npm run prisma:studio`
- Cleanup: `npm run cleanup:email-queue`, `npm run cleanup:ai-tmp`

### 15) Contact & Escalation
- Payment incidents → provider status page + keys/secret rotation
- AI incidents → Stability status, egress firewall, key
- SMTP incidents → provider status, TLS flags


