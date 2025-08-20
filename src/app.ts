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
import orderRoutes from './modules/orders/routes';
import path from 'path';
import fs from 'fs';

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
// CSRF token üret (yoksa set et) – kriptografik güçlü token
app.use((req, res, next) => {
  if (!req.cookies?.csrf) {
    const token = crypto.randomBytes(16).toString('hex');
    res.cookie('csrf', token, { httpOnly: false, sameSite: 'lax', secure: env.COOKIE_SECURE, domain: env.COOKIE_DOMAIN });
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
  const bypass = new Set(['/api/auth/refresh']);
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

app.use('/api/auth', rateLimitMiddleware, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/message-cards', messageCardRoutes);
app.use('/api/orders', orderRoutes);

// Serve uploaded files read-only from upload dir (outside of API namespaces)
const uploadAbs = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadAbs)) {
  fs.mkdirSync(uploadAbs, { recursive: true });
}
app.use('/uploads', express.static(uploadAbs, { fallthrough: false, dotfiles: 'ignore', etag: true, immutable: false, maxAge: '7d' }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

