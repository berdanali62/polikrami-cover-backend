"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefreshToken = createRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeAllRefreshTokensByUser = revokeAllRefreshTokensByUser;
exports.findLatestRefreshTokenByUser = findLatestRefreshTokenByUser;
exports.createEmailVerificationToken = createEmailVerificationToken;
exports.useEmailVerificationToken = useEmailVerificationToken;
exports.createPasswordResetToken = createPasswordResetToken;
exports.findValidPasswordResetToken = findValidPasswordResetToken;
exports.markPasswordResetTokenUsed = markPasswordResetTokenUsed;
const database_1 = require("../../../config/database");
async function createRefreshToken(params) {
    return database_1.prisma.refreshToken.create({ data: params });
}
async function revokeRefreshToken(id) {
    return database_1.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
}
async function revokeAllRefreshTokensByUser(userId) {
    return database_1.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
async function findLatestRefreshTokenByUser(userId) {
    return database_1.prisma.refreshToken.findFirst({ where: { userId, revokedAt: null }, orderBy: { createdAt: 'desc' } });
}
async function createEmailVerificationToken(params) {
    return database_1.prisma.emailVerificationToken.create({ data: { userId: params.userId, tokenHash: params.tokenHash, expiresAt: params.expiresAt } });
}
async function useEmailVerificationToken(params) {
    return database_1.prisma.emailVerificationToken.updateMany({ where: { userId: params.userId, usedAt: null }, data: { usedAt: new Date() } });
}
async function createPasswordResetToken(params) {
    return database_1.prisma.passwordResetToken.create({ data: { userId: params.userId, tokenHash: params.tokenHash, expiresAt: params.expiresAt } });
}
async function findValidPasswordResetToken(params) {
    return database_1.prisma.passwordResetToken.findFirst({ where: { userId: params.userId, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
}
async function markPasswordResetTokenUsed(id) {
    return database_1.prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}
