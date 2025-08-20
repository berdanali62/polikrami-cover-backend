import { prisma } from '../../../config/database';

export async function createRefreshToken(params: {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
}) {
  return prisma.refreshToken.create({ data: params });
}

export async function revokeRefreshToken(id: string) {
  return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
}

export async function revokeAllRefreshTokensByUser(userId: string) {
  return prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function findLatestRefreshTokenByUser(userId: string) {
  return prisma.refreshToken.findFirst({ where: { userId, revokedAt: null }, orderBy: { createdAt: 'desc' } });
}

export async function createEmailVerificationToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
  return prisma.emailVerificationToken.create({ data: { userId: params.userId, tokenHash: params.tokenHash, expiresAt: params.expiresAt } });
}

export async function useEmailVerificationToken(params: { userId: string }) {
  return prisma.emailVerificationToken.updateMany({ where: { userId: params.userId, usedAt: null }, data: { usedAt: new Date() } });
}

export async function createPasswordResetToken(params: { userId: string; tokenHash: string; expiresAt: Date }) {
  return prisma.passwordResetToken.create({ data: { userId: params.userId, tokenHash: params.tokenHash, expiresAt: params.expiresAt } });
}

export async function findValidPasswordResetToken(params: { userId: string }) {
  return prisma.passwordResetToken.findFirst({ where: { userId: params.userId, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
}

export async function markPasswordResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}

