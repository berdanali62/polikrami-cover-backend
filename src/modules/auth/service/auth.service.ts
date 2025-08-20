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
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(params: { email: string; password: string; ua?: string; ip?: string }) {
    const user = await findUserByEmail(params.email);
    if (!user) throw unauthorized('Invalid credentials');
    const ok = await verifyPassword(user.password, params.password);
    if (!ok) throw unauthorized('Invalid credentials');

    const access = signAccessToken({ userId: user.id });
    const tokenId = randomUUID();
    const refresh = signRefreshToken({ userId: user.id, tid: tokenId });

    // store refresh hash (JWT kendisi hashlenebilir veya HMAC uygulanabilir; basitlik için direkt hash’li değil tokenId kullanıyoruz)
    const expiresAt = new Date(Date.now() + ms(env.REFRESH_EXPIRES_IN));
    await createRefreshToken({ id: tokenId, userId: user.id, tokenHash: tokenId, userAgent: params.ua, ip: params.ip, expiresAt });

    return { access, refresh };
  }

  async refresh(params: { userId: string; refreshTid: string; ua?: string; ip?: string }) {
    const latest = await findLatestRefreshTokenByUser(params.userId);
    if (!latest || latest.revokedAt) throw unauthorized('Invalid refresh');
    if (latest.id !== params.refreshTid) {
      // reuse detection → revoke all aktifleri iptal et
      await revokeAllRefreshTokensByUser(params.userId);
      throw unauthorized('Refresh reuse detected');
    }
    await revokeRefreshToken(latest.id);
    const access = signAccessToken({ userId: params.userId });
    const newTid = randomUUID();
    const refresh = signRefreshToken({ userId: params.userId, tid: newTid });
    const expiresAt = new Date(Date.now() + ms(env.REFRESH_EXPIRES_IN));
    await createRefreshToken({ id: newTid, userId: params.userId, tokenHash: newTid, userAgent: params.ua, ip: params.ip, expiresAt });
    return { access, refresh };
  }

  async forgotPassword(email: string) {
    const user = await findUserByEmail(email);
    if (!user) return; // gizlilik
    // 4 haneli kod üret
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 dk
    const tokenHash = await hashToken(code);
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
    await sendEmail({ to: user.email, subject: 'Your reset code', text: `Reset code: ${code}` });
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

