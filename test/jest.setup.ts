import dotenv from 'dotenv';
dotenv.config();

// Increase default timeout for longer e2e flows
jest.setTimeout(30000);

// Mock nodemailer to avoid real SMTP connections in tests
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: () => ({
      sendMail: async () => ({ messageId: 'test-message-id' }),
    }),
  },
}));

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_123456';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_123456';
process.env.ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '900s';
process.env.REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
process.env.APP_URL = process.env.APP_URL || 'http://localhost:3000';
process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
process.env.SMTP_PORT = process.env.SMTP_PORT || '1025';
process.env.SMTP_SECURE = process.env.SMTP_SECURE || 'false';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE || 'false';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads-test';
process.env.UPLOAD_MAX_SIZE_MB = process.env.UPLOAD_MAX_SIZE_MB || '10';
process.env.UPLOAD_ALLOWED_MIME = process.env.UPLOAD_ALLOWED_MIME || 'image/png,image/jpeg';

// DATABASE_URL will be taken from .env if present; do not override ports/credentials here

