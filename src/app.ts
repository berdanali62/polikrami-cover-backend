import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { env } from './config/env';
import { securityHeaders } from './middlewares/securityHeaders';
import { rateLimitMiddleware } from './middlewares/rateLimit';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import projectRoutes from './modules/projects/routes';
import draftRoutes from './modules/drafts/routes';
import messageCardRoutes from './modules/message-cards/routes';
import designerRoutes from './modules/designers/routes';
import orderRoutes from './modules/orders/routes';
import contactRoutes from './modules/contact/routes';
import paymentRoutes from './modules/payments/routes';
import organizationRoutes from './modules/organizations/routes';
import templateRoutes from './modules/templates/routes';
import categoryRoutes from './modules/categories/routes';
import commentRoutes from './modules/comments/routes';
import searchRoutes from './modules/search/routes';
import notificationRoutes from './modules/notifications/routes';
import assetRoutes from './modules/assets/routes';
import walletRoutes from './modules/wallet/routes';
import likesRoutes from './modules/likes/routes';
import addressesRoutes from './modules/addresses/routes';
import returnsRoutes from './modules/returns/routes';
import aiRoutes from './modules/ai/routes';
import shipmentRoutes from './modules/shipments/routes';
// Lazy-load swagger only if installed
let swaggerUi: any = null;
let yaml: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  swaggerUi = require('swagger-ui-express');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  yaml = require('yamljs');
} catch {}
import path from 'path';
import fs from 'fs';
import { metricsController, metricsMiddleware, aiJobsGauge } from './middlewares/metrics';
import { aiQueue } from './queue/ai.queue';
import { asyncHandler } from './shared/helpers/asyncHandler';
import { AuthService } from './modules/auth/service/auth.service';
import { Router } from 'express';

const app = express();

app.set('trust proxy', 1);

// Tek bir helmet konfigürü kullanmak için securityHeaders yeterlidir
app.use(securityHeaders());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(Object.assign(new Error('CORS not allowed'), { status: 403 }));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Metrics middleware (must be before routes to capture durations)
app.use(metricsMiddleware);
// CSRF token üret (yoksa set et) – kriptografik güçlü token
app.use((req, res, next) => {
  if (!req.cookies?.csrf) {
    const token = crypto.randomBytes(16).toString('hex');
    const base = { httpOnly: false, sameSite: 'lax' as const, secure: env.COOKIE_SECURE };
    const opts = env.COOKIE_DOMAIN ? { ...base, domain: env.COOKIE_DOMAIN } : base;
    res.cookie('csrf', token, opts);
  }
  next();
});
// Test kolaylığı için CSRF token'ı tetikleyen endpoint
app.get('/csrf', (req, res) => {
  let token = req.cookies?.csrf as string | undefined;
  if (!token) {
    token = crypto.randomBytes(16).toString('hex');
    const base = { httpOnly: false, sameSite: 'lax' as const, secure: env.COOKIE_SECURE };
    const opts = env.COOKIE_DOMAIN ? { ...base, domain: env.COOKIE_DOMAIN } : base;
    res.cookie('csrf', token, opts);
  }
  res.status(200).json({ token });
});
// CSRF double-submit doğrulaması (state-changing)
app.use((req, res, next) => {
  if (env.NODE_ENV === 'test') return next();
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const bypass = new Set([
    // legacy
    '/api/auth/refresh',
    '/api/payments/callback',
    '/api/shipments/webhook/mock',
    '/api/auth/register',
    '/api/auth/login',
    '/api/contact',
    // versioned
    '/api/v1/auth/refresh',
    '/api/v1/payments/callback',
    '/api/v1/shipments/webhook/mock',
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/likes/toggle',
    '/api/v1/contact',
  ]);
  if (bypass.has(req.path)) return next();
  const csrfCookie = req.cookies?.csrf;
  const csrfHeader = req.headers['x-csrf-token'];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF token invalid' });
  }
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Prometheus metrics endpoint
app.get('/metrics', asyncHandler(metricsController as unknown as import('express').RequestHandler));

// Background metrics updater for AI queue depth
if (aiQueue) {
  setInterval((): void => {
    void (async (): Promise<void> => {
      try {
        const queueAny: { getJobCounts: (...s: string[]) => Promise<Record<string, number>> } = aiQueue as unknown as { getJobCounts: (...s: string[]) => Promise<Record<string, number>> };
        const counts = await queueAny.getJobCounts('waiting', 'delayed');
        const waiting = Number(counts?.waiting || 0);
        const delayed = Number(counts?.delayed || 0);
        aiJobsGauge.set(waiting + delayed);
      } catch {
        // ignore metrics errors
      }
    })();
  }, 10000);
}

// API versioning (mount both legacy /api and versioned /api/v1 during transition)
const v1 = Router();
v1.use('/auth', (req, res, next) => { void rateLimitMiddleware(req, res, next); }, authRoutes);
v1.use('/users', userRoutes);
v1.use('/projects', projectRoutes);
v1.use('/drafts', draftRoutes);
v1.use('/message-cards', messageCardRoutes);
v1.use('/orders', orderRoutes);
v1.use('/contact', (req, res, next) => { void rateLimitMiddleware(req, res, next); }, contactRoutes);
v1.use('/designers', designerRoutes);
v1.use('/payments', paymentRoutes);
v1.use('/organizations', organizationRoutes);
v1.use('/templates', templateRoutes);
v1.use('/categories', categoryRoutes);
v1.use('/comments', commentRoutes);
v1.use('/search', searchRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/assets', assetRoutes);
v1.use('/wallet', walletRoutes);
v1.use('/likes', likesRoutes);
v1.use('/addresses', addressesRoutes);
v1.use('/returns', returnsRoutes);
v1.use('/ai', aiRoutes);
v1.use('/shipments', shipmentRoutes);

app.use('/api/v1', v1);
// Legacy (to be removed after FE cutover)
app.use('/api', v1);

// Swagger UI (public docs)
try {
  if (swaggerUi && yaml) {
    const openapi = yaml.load(path.join(process.cwd(), 'src', 'docs', 'openapi.yaml'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  }
} catch {
  // ignore if yamljs not available or file missing
}

// Handle email verification links from emails (GET /verify-email?token=...)
app.get('/verify-email', asyncHandler(async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) return res.status(400).json({ message: 'Token is required' });
  const service = new AuthService();
  await service.verifyEmail(token);
  const redirectTo = env.EMAIL_REDIRECT_TO || 'http://localhost:3001/pages/user-Login.html';
  res.redirect(302, redirectTo);
}));

// Serve uploaded files read-only from PUBLIC upload dir (outside of API namespaces)
const publicUploadAbs = path.isAbsolute(env.UPLOAD_PUBLIC_DIR) ? env.UPLOAD_PUBLIC_DIR : path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR);
const privateUploadAbs = path.isAbsolute(env.UPLOAD_PRIVATE_DIR) ? env.UPLOAD_PRIVATE_DIR : path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR);
if (!fs.existsSync(publicUploadAbs)) fs.mkdirSync(publicUploadAbs, { recursive: true });
if (!fs.existsSync(privateUploadAbs)) fs.mkdirSync(privateUploadAbs, { recursive: true });
app.use('/uploads', express.static(publicUploadAbs, { fallthrough: false, dotfiles: 'ignore', etag: true, immutable: false, maxAge: '7d' }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

