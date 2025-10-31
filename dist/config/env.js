"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Backward-compat / alternative env names mapping (no-op if primary exists)
const E = process.env;
if (!E.SMTP_USER && E.SMTP_USERNAME)
    E.SMTP_USER = E.SMTP_USERNAME;
if (!E.SMTP_PASS && E.SMTP_PASSWORD)
    E.SMTP_PASS = E.SMTP_PASSWORD;
if (!E.ALLOWED_ORIGINS && E.CORS_ORIGIN)
    E.ALLOWED_ORIGINS = E.CORS_ORIGIN;
if (!E.DATABASE_URL && E.PGHOST) {
    const user = E.PGUSER ?? 'postgres';
    const pass = E.PGPASSWORD ? encodeURIComponent(E.PGPASSWORD) : '';
    const host = E.PGHOST ?? 'localhost';
    const port = E.PGPORT ?? '6262';
    const db = E.PGDATABASE ?? 'postgres';
    E.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
}
// Storage backward-compat: allow legacy STORAGE_* names to populate new UPLOAD_* vars
if (!E.UPLOAD_MAX_SIZE_MB && E.STORAGE_MAX_SIZE_MB)
    E.UPLOAD_MAX_SIZE_MB = E.STORAGE_MAX_SIZE_MB;
if (!E.UPLOAD_ALLOWED_MIME && E.STORAGE_ALLOWED_MIME)
    E.UPLOAD_ALLOWED_MIME = E.STORAGE_ALLOWED_MIME;
if (!E.UPLOAD_DIR && E.STORAGE_DIR)
    E.UPLOAD_DIR = E.STORAGE_DIR;
// New public/private upload roots with backward-compat
if (!E.UPLOAD_PUBLIC_DIR && E.UPLOAD_DIR)
    E.UPLOAD_PUBLIC_DIR = E.UPLOAD_DIR;
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    ACCESS_EXPIRES_IN: zod_1.z.string().default('900s'),
    REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    COOKIE_DOMAIN: zod_1.z.string().optional().default(''),
    COOKIE_SECURE: zod_1.z.string().transform((v) => v === 'true').default('false'),
    // CSRF_SECRET şu an uygulamada kullanılmıyor; zorunlu olmamalı
    CSRF_SECRET: zod_1.z.string().optional().default(''),
    ALLOWED_ORIGINS: zod_1.z
        .string()
        .default('http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3001,http://127.0.0.1:3001')
        .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
    APP_URL: zod_1.z.string().default('http://localhost:3000'),
    CDN_URL: zod_1.z.string().optional().default(''),
    SMTP_HOST: zod_1.z.string().default('localhost'),
    SMTP_PORT: zod_1.z.coerce.number().default(1025),
    SMTP_SECURE: zod_1.z.string().transform((v) => v === 'true').default('false'),
    SMTP_USER: zod_1.z.string().optional().default(''),
    SMTP_PASS: zod_1.z.string().optional().default(''),
    EMAIL_FROM: zod_1.z.string().email().default('no-reply@example.com'),
    CONTACT_TO: zod_1.z.string().email().or(zod_1.z.literal('')).default(''),
    // Boş bırakılabilir; doluysa geçerli e-posta olmalı -> basitleştirip boş stringe izin veriyoruz
    EMAIL_REDIRECT_TO: zod_1.z.string().optional().default(''),
    SMTP_TLS_INSECURE: zod_1.z.string().transform((v) => v === 'true').default('false'),
    SMTP_REQUIRE_TLS: zod_1.z.string().transform((v) => v === 'true').default('false'),
    SMTP_IGNORE_TLS: zod_1.z.string().transform((v) => v === 'true').default('false'),
    SMTP_NAME: zod_1.z.string().optional().default(''),
    SMTP_LOGGER: zod_1.z.string().transform((v) => v === 'true').default('false'),
    SMTP_DEBUG: zod_1.z.string().transform((v) => v === 'true').default('false'),
    SMTP_CONNECTION_TIMEOUT_MS: zod_1.z.coerce.number().default(10000),
    SMTP_GREETING_TIMEOUT_MS: zod_1.z.coerce.number().default(10000),
    SMTP_SOCKET_TIMEOUT_MS: zod_1.z.coerce.number().default(10000),
    SMTP_AUTH_METHOD: zod_1.z.string().optional().default(''),
    SMTP_TLS_MIN_VERSION: zod_1.z.enum(['', 'TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3']).default(''),
    // Local upload config
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    UPLOAD_PUBLIC_DIR: zod_1.z.string().default('./uploads'),
    UPLOAD_PRIVATE_DIR: zod_1.z.string().default('./uploads-private'),
    UPLOAD_MAX_SIZE_MB: zod_1.z.coerce.number().default(100),
    UPLOAD_ALLOWED_MIME: zod_1.z
        .string()
        .default('image/png,image/jpeg,image/webp,application/pdf')
        .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
    // Business configuration
    SHIPPING_COST_CENTS: zod_1.z.coerce.number().default(3000), // 30 TL default shipping cost
    PASSWORD_RESET_CODE_EXPIRE_MINUTES: zod_1.z.coerce.number().default(10),
    EMAIL_VERIFY_CODE_EXPIRE_MINUTES: zod_1.z.coerce.number().default(60),
    PHONE_VERIFY_CODE_EXPIRE_MINUTES: zod_1.z.coerce.number().default(10),
    PHONE_VERIFY_PROVIDER: zod_1.z.enum(['code', 'firebase']).default('code'),
    SMS_PROVIDER: zod_1.z.enum(['mock', 'twilio']).default('mock'),
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional().default(''),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional().default(''),
    TWILIO_FROM: zod_1.z.string().optional().default(''),
    // Firebase Admin (for phone verification via Firebase)
    FIREBASE_PROJECT_ID: zod_1.z.string().optional().default(''),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().optional().default(''),
    FIREBASE_PRIVATE_KEY: zod_1.z
        .string()
        .optional()
        .default(''),
    // Email queue cleanup configuration
    EMAIL_QUEUE_CLEANUP_DAYS: zod_1.z.coerce.number().default(30),
    EMAIL_QUEUE_FAILED_CLEANUP_HOURS: zod_1.z.coerce.number().default(24),
    // Payment provider configuration
    IYZICO_API_KEY: zod_1.z.string().optional().default(''),
    IYZICO_SECRET_KEY: zod_1.z.string().optional().default(''),
    IYZICO_BASE_URL: zod_1.z.string().default('https://sandbox-api.iyzipay.com'), // sandbox or https://api.iyzipay.com
    PAYMENT_PROVIDER: zod_1.z.enum(['mock', 'iyzico']).default('mock'),
    // AI & Queue configuration
    STABILITY_API_KEY: zod_1.z.string().optional().default(''),
    REDIS_URL: zod_1.z.string().optional().default(''),
    WATERMARK_TEXT: zod_1.z.string().optional().default('polikrami-preview'),
    WATERMARK_OPACITY: zod_1.z.coerce.number().min(0).max(1).default(0.2),
    WATERMARK_POSITION: zod_1.z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('bottom-right'),
    WATERMARK_LOGO_PATH: zod_1.z.string().optional().default(''),
    // Shipment tracking configuration
    SHIPMENT_PROVIDER: zod_1.z.enum(['mock']).default('mock'),
    SHIPMENT_WEBHOOK_SECRET: zod_1.z.string().optional().default(''),
    SHIPMENT_SYNC_INTERVAL_MS: zod_1.z.coerce.number().default(300000),
    SHIPMENT_DEFAULT_CARRIER: zod_1.z.string().optional().default('mock'),
    SHIPMENT_CARRIERS: zod_1.z
        .string()
        .default('mock:Mock Carrier,yurtici:Yurtiçi Kargo,aras:Aras Kargo,ptt:PTT Kargo')
        .transform((s) => s
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
        .map((pair) => {
        const parts = pair.split(':');
        const rawCode = parts[0] ?? '';
        const rawName = parts.slice(1).join(':');
        const code = rawCode.trim();
        const name = (rawName || rawCode).trim();
        return code ? { code, name } : null;
    })
        .filter((v) => v !== null)),
    // Business logic configuration
    WELCOME_BONUS_CREDITS: zod_1.z.coerce.number().default(500),
    MAX_DRAFT_REVISIONS: zod_1.z.coerce.number().default(3),
    MAX_USER_ADDRESSES: zod_1.z.coerce.number().default(10),
    MAX_FAILED_LOGIN_ATTEMPTS: zod_1.z.coerce.number().default(5),
    LOGIN_LOCKOUT_WINDOW_MINUTES: zod_1.z.coerce.number().default(10),
    // Rate limiting configuration
    RATE_LIMIT_GLOBAL_POINTS: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_GLOBAL_DURATION: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_EMAIL_VERIFICATION_POINTS: zod_1.z.coerce.number().default(3),
    RATE_LIMIT_EMAIL_VERIFICATION_DURATION: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_PASSWORD_RESET_POINTS: zod_1.z.coerce.number().default(3),
    RATE_LIMIT_PASSWORD_RESET_DURATION: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_PHONE_VERIFICATION_POINTS: zod_1.z.coerce.number().default(5),
    RATE_LIMIT_PHONE_VERIFICATION_DURATION: zod_1.z.coerce.number().default(60),
});
exports.env = schema.parse(process.env);
