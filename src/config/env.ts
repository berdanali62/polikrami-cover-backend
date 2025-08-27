import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Backward-compat / alternative env names mapping (no-op if primary exists)
const E = process.env as Record<string, string | undefined>;
if (!E.SMTP_USER && E.SMTP_USERNAME) E.SMTP_USER = E.SMTP_USERNAME;
if (!E.SMTP_PASS && E.SMTP_PASSWORD) E.SMTP_PASS = E.SMTP_PASSWORD;
if (!E.ALLOWED_ORIGINS && E.CORS_ORIGIN) E.ALLOWED_ORIGINS = E.CORS_ORIGIN;
if (!E.DATABASE_URL && E.PGHOST) {
  const user = E.PGUSER ?? 'postgres';
  const pass = E.PGPASSWORD ? encodeURIComponent(E.PGPASSWORD) : '';
  const host = E.PGHOST ?? 'localhost';
  const port = E.PGPORT ?? '6262';
  const db = E.PGDATABASE ?? 'postgres';
  E.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
}
// Storage backward-compat: allow legacy STORAGE_* names to populate new UPLOAD_* vars
if (!E.UPLOAD_MAX_SIZE_MB && E.STORAGE_MAX_SIZE_MB) E.UPLOAD_MAX_SIZE_MB = E.STORAGE_MAX_SIZE_MB;
if (!E.UPLOAD_ALLOWED_MIME && E.STORAGE_ALLOWED_MIME) E.UPLOAD_ALLOWED_MIME = E.STORAGE_ALLOWED_MIME;
if (!E.UPLOAD_DIR && E.STORAGE_DIR) E.UPLOAD_DIR = E.STORAGE_DIR;

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_EXPIRES_IN: z.string().default('900s'),
  REFRESH_EXPIRES_IN: z.string().default('30d'),
  COOKIE_DOMAIN: z.string().optional().default(''),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
  // CSRF_SECRET şu an uygulamada kullanılmıyor; zorunlu olmamalı
  CSRF_SECRET: z.string().optional().default(''),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:8080')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  APP_URL: z.string().default('http://localhost:3000'),
  CDN_URL: z.string().optional().default(''),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.string().transform((v) => v === 'true').default('false'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().email().default('no-reply@example.com'),
  CONTACT_TO: z.string().email().or(z.literal('')).default(''),
  // Boş bırakılabilir; doluysa geçerli e-posta olmalı -> basitleştirip boş stringe izin veriyoruz
  EMAIL_REDIRECT_TO: z.string().optional().default(''),
  SMTP_TLS_INSECURE: z.string().transform((v) => v === 'true').default('false'),
  // Local upload config
  UPLOAD_DIR: z.string().default('./uploads'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(100),
  UPLOAD_ALLOWED_MIME: z
    .string()
    .default('image/png,image/jpeg,image/webp,application/pdf')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  // Business configuration
  SHIPPING_COST_CENTS: z.coerce.number().default(3000), // 30 TL default shipping cost
  PASSWORD_RESET_CODE_EXPIRE_MINUTES: z.coerce.number().default(10),
  EMAIL_VERIFY_CODE_EXPIRE_MINUTES: z.coerce.number().default(60),
  // Email queue cleanup configuration
  EMAIL_QUEUE_CLEANUP_DAYS: z.coerce.number().default(30),
  EMAIL_QUEUE_FAILED_CLEANUP_HOURS: z.coerce.number().default(24),
  // Payment provider configuration
  IYZICO_API_KEY: z.string().optional().default(''),
  IYZICO_SECRET_KEY: z.string().optional().default(''),
  IYZICO_BASE_URL: z.string().default('https://sandbox-api.iyzipay.com'), // sandbox or https://api.iyzipay.com
  PAYMENT_PROVIDER: z.enum(['mock', 'iyzico']).default('mock'),
});

export const env = schema.parse(process.env);

