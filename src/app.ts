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
import aiRoutes from './modules/ai/routes';
import shipmentRoutes from './modules/shipments/routes';
import path from 'path';
import fs from 'fs';
import { metricsController, metricsMiddleware, aiJobsGauge } from './middlewares/metrics';
import { aiQueue } from './queue/ai.queue';
import { asyncHandler } from './shared/helpers/asyncHandler';

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
app.get('/csrf', (_req, res) => {
  res.status(200).json({ ok: true });
});
// CSRF double-submit doğrulaması (state-changing)
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const bypass = new Set(['/api/auth/refresh', '/api/payments/callback', '/api/shipments/webhook/mock']);
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

app.use('/api/auth', (req, res, next) => { void rateLimitMiddleware(req, res, next); }, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/message-cards', messageCardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', (req, res, next) => { void rateLimitMiddleware(req, res, next); }, contactRoutes); // Rate limit contact form
app.use('/api/designers', designerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', aiRoutes);
app.use('/api/shipments', shipmentRoutes);

// Serve uploaded files read-only from PUBLIC upload dir (outside of API namespaces)
const publicUploadAbs = path.isAbsolute(env.UPLOAD_PUBLIC_DIR) ? env.UPLOAD_PUBLIC_DIR : path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR);
const privateUploadAbs = path.isAbsolute(env.UPLOAD_PRIVATE_DIR) ? env.UPLOAD_PRIVATE_DIR : path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR);
if (!fs.existsSync(publicUploadAbs)) fs.mkdirSync(publicUploadAbs, { recursive: true });
if (!fs.existsSync(privateUploadAbs)) fs.mkdirSync(privateUploadAbs, { recursive: true });
app.use('/uploads', express.static(publicUploadAbs, { fallthrough: false, dotfiles: 'ignore', etag: true, immutable: false, maxAge: '7d' }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

