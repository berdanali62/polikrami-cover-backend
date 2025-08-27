import { randomUUID } from 'crypto';
import { findUserByEmail, createUser } from '../repository/userRepo';
import { createRefreshToken, revokeRefreshToken, findLatestRefreshTokenByUser, revokeAllRefreshTokensByUser } from '../repository/tokenRepo';
import { hashPassword, verifyPassword, hashToken, verifyTokenHash } from '../../../shared/helpers/crypto';
import { signAccessToken, signRefreshToken, verifyToken } from '../../../shared/helpers/jwt';
import { env } from '../../../config/env';
import { prisma } from '../../../config/database';
import { sendEmail } from '../../../shared/email/mailer';
import { ApiError, unauthorized, badRequest, conflict, notFound } from '../../../shared/errors/ApiError';

export class AuthService {
  async register(params: { email: string; password: string; name?: string; role?: 'user' | 'designer' }) {
    const existing = await findUserByEmail(params.email);
    if (existing) {
      throw conflict('Email already in use');
    }
    const password = await hashPassword(params.password);
    const user = await createUser({ email: params.email, password, name: params.name, role: params.role });
    // Generate email verification token
    try {
      const code = randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * env.EMAIL_VERIFY_CODE_EXPIRE_MINUTES);
      const tokenHash = await hashToken(code);
      await prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
      const verifyLink = `${env.APP_URL}/verify-email?token=${encodeURIComponent(code)}`;
      await sendEmail({ to: user.email, subject: 'Verify your email', text: `Click to verify: ${verifyLink}` });
    } catch (error) {
      const { logger } = await import('../../../utils/logger');
      logger.error({ error, email: params.email }, 'Failed to send email verification');
    }
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(params: { email: string; password: string; ua?: string; ip?: string }) {
    const user = await findUserByEmail(params.email);
    if (!user) throw unauthorized('Invalid credentials');
    const ok = await verifyPassword(user.password, params.password);
    if (!ok) throw unauthorized('Invalid credentials');

    // Get user role for JWT
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } }
    });
    const roleName = userWithRole?.roles?.[0]?.role?.name;

    const access = signAccessToken({ userId: user.id, role: roleName });
    const tokenId = randomUUID();
    const refresh = signRefreshToken({ userId: user.id, tid: tokenId });

    // store refresh hash - tokenId should be hashed for security
    const expiresAt = new Date(Date.now() + ms(env.REFRESH_EXPIRES_IN));
    const tokenHash = await hashToken(tokenId);
    await createRefreshToken({ id: tokenId, userId: user.id, tokenHash, userAgent: params.ua, ip: params.ip, expiresAt });

    return { access, refresh };
  }

  async resendVerification(email: string) {
    const user = await findUserByEmail(email);
    if (!user) return; // gizlilik
    if (user.emailVerifiedAt) return;
    const code = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * env.EMAIL_VERIFY_CODE_EXPIRE_MINUTES);
    const tokenHash = await hashToken(code);
    await prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
    const verifyLink = `${env.APP_URL}/verify-email?token=${encodeURIComponent(code)}`;
    await sendEmail({ to: user.email, subject: 'Verify your email', text: `Click to verify: ${verifyLink}` });
  }

  async verifyEmail(token: string) {
    const rec = await prisma.emailVerificationToken.findFirst({ where: { usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!rec) throw badRequest('Invalid token');
    const ok = await verifyTokenHash(rec.tokenHash, token);
    if (!ok) throw badRequest('Invalid token');
    await prisma.$transaction([
      prisma.user.update({ where: { id: rec.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    ]);
  }

  async refresh(params: { userId: string; refreshTid: string; ua?: string; ip?: string }) {
    const latest = await findLatestRefreshTokenByUser(params.userId);
    if (!latest || latest.revokedAt) throw unauthorized('Invalid refresh');
    if (latest.id !== params.refreshTid) {
      // reuse detection → revoke all aktifleri iptal et
      await revokeAllRefreshTokensByUser(params.userId);
      throw unauthorized('Refresh reuse detected');
    }
    // Verify token hash for additional security
    const isValidHash = await verifyTokenHash(latest.tokenHash, params.refreshTid);
    if (!isValidHash) {
      await revokeAllRefreshTokensByUser(params.userId);
      throw unauthorized('Invalid refresh token hash');
    }
    await revokeRefreshToken(latest.id);
    
    // Get user role for new JWT
    const userWithRole = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { roles: { include: { role: true } } }
    });
    const roleName = userWithRole?.roles?.[0]?.role?.name;
    
    const access = signAccessToken({ userId: params.userId, role: roleName });
    const newTid = randomUUID();
    const refresh = signRefreshToken({ userId: params.userId, tid: newTid });
    const expiresAt = new Date(Date.now() + ms(env.REFRESH_EXPIRES_IN));
    const newTokenHash = await hashToken(newTid);
    await createRefreshToken({ id: newTid, userId: params.userId, tokenHash: newTokenHash, userAgent: params.ua, ip: params.ip, expiresAt });
    return { access, refresh };
  }

  async forgotPassword(email: string) {
    const user = await findUserByEmail(email);
    if (!user) return; // gizlilik
    
    try {
      // 4 haneli kod üret
      const code = String(Math.floor(1000 + Math.random() * 9000));
      const expiresAt = new Date(Date.now() + 1000 * 60 * env.PASSWORD_RESET_CODE_EXPIRE_MINUTES);
      const tokenHash = await hashToken(code);
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
      await sendEmail({ to: user.email, subject: 'Your reset code', text: `Reset code: ${code}` });
    } catch (error) {
      const { logger } = await import('../../../utils/logger');
      logger.error({ error, email: user.email }, 'Failed to send password reset email');
      // Don't throw error to prevent information disclosure
    }
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const user = await findUserByEmail(email);
    if (!user) return false;
    const token = await prisma.passwordResetToken.findFirst({ where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!token) return false;
    return await verifyTokenHash(token.tokenHash, code);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await findUserByEmail(email);
    if (!user) throw badRequest('Invalid email');
    const token = await prisma.passwordResetToken.findFirst({ where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!token || !(await verifyTokenHash(token.tokenHash, code))) throw badRequest('Invalid code');
    const password = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password } }),
      prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    ]);
  }

  verifyRefreshToken(token: string): { userId: string; tid: string } | null {
    const payload = verifyToken<{ userId: string; tid: string; typ: string }>(token, 'refresh');
    if (!payload || payload.typ !== 'refresh' || !payload.userId || !payload.tid) return null;
    return { userId: payload.userId, tid: payload.tid };
  }
}

function ms(spec: string): number {
  // minimal duration parser: 30d / 900s
  const m = spec.match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const v = Number(m[1]);
  const u = m[2];
  if (u === 's') return v * 1000;
  if (u === 'm') return v * 60 * 1000;
  if (u === 'h') return v * 60 * 60 * 1000;
  if (u === 'd') return v * 24 * 60 * 60 * 1000;
  return 0;
}

