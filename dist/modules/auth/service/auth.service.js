"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = require("crypto");
const userRepo_1 = require("../repository/userRepo");
const tokenRepo_1 = require("../repository/tokenRepo");
const crypto_2 = require("../../../shared/helpers/crypto");
const jwt_1 = require("../../../shared/helpers/jwt");
const accountLock_1 = require("../../../middlewares/accountLock");
const env_1 = require("../../../config/env");
const database_1 = require("../../../config/database");
const mailer_1 = require("../../../shared/email/mailer");
const ApiError_1 = require("../../../shared/errors/ApiError");
class AuthService {
    async register(params) {
        const existing = await (0, userRepo_1.findUserByEmail)(params.email);
        if (existing) {
            throw (0, ApiError_1.conflict)('Email already in use');
        }
        const password = await (0, crypto_2.hashPassword)(params.password);
        // Transaction: Create user, update acceptance timestamps, create profile, grant credits
        const user = await database_1.prisma.$transaction(async (tx) => {
            const newUser = await (0, userRepo_1.createUser)({ email: params.email, password, name: params.name, role: params.role });
            // Update acceptance timestamps
            await tx.user.update({
                where: { id: newUser.id },
                data: {
                    termsAcceptedAt: params.acceptTerms ? new Date() : undefined,
                    privacyAcceptedAt: params.acceptPrivacy ? new Date() : undefined,
                },
            });
            // Create profile if designer and revenue share accepted
            if (params.role === 'designer' && params.acceptRevenueShare) {
                await tx.userProfile.upsert({
                    where: { userId: newUser.id },
                    update: { revenueShareAcceptedAt: new Date() },
                    create: { userId: newUser.id, revenueShareAcceptedAt: new Date() }
                });
            }
            // Grant welcome bonus credits
            await tx.creditWallet.upsert({
                where: { userId: newUser.id },
                update: { balance: { increment: env_1.env.WELCOME_BONUS_CREDITS } },
                create: { userId: newUser.id, balance: env_1.env.WELCOME_BONUS_CREDITS }
            });
            await tx.creditTransaction.create({
                data: {
                    userId: newUser.id,
                    delta: env_1.env.WELCOME_BONUS_CREDITS,
                    type: 'gift',
                    note: 'welcome-bonus'
                }
            });
            return newUser;
        });
        // Generate email verification token (outside transaction to avoid blocking)
        try {
            const code = (0, crypto_1.randomUUID)();
            const expiresAt = new Date(Date.now() + 1000 * 60 * env_1.env.EMAIL_VERIFY_CODE_EXPIRE_MINUTES);
            const tokenHash = await (0, crypto_2.hashToken)(code);
            await database_1.prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
            const verifyLink = `${env_1.env.APP_URL}/verify-email?token=${encodeURIComponent(code)}`;
            await (0, mailer_1.sendEmail)({ to: user.email, subject: 'Verify your email', text: `Click to verify: ${verifyLink}` });
        }
        catch (error) {
            const { logger } = await Promise.resolve().then(() => __importStar(require('../../../utils/logger')));
            logger.error({ error, email: params.email }, 'Failed to send email verification');
            // Don't throw - user is created, they can request another verification email
        }
        return { id: user.id, email: user.email, name: user.name };
    }
    async login(params) {
        const user = await (0, userRepo_1.findUserByEmail)(params.email);
        if (!user)
            throw (0, ApiError_1.unauthorized)('Invalid credentials');
        const ok = await (0, crypto_2.verifyPassword)(user.password, params.password);
        if (!ok) {
            try {
                await (0, accountLock_1.recordLoginFailure)(user.id);
            }
            catch { /* ignore */ }
            throw (0, ApiError_1.unauthorized)('Invalid credentials');
        }
        // Get user role for JWT - optimized single query
        const userWithRole = await database_1.prisma.user.findUnique({
            where: { id: user.id },
            select: {
                roles: {
                    select: { role: { select: { name: true } } },
                    take: 1 // Only get first role for performance
                }
            }
        });
        const roleName = userWithRole?.roles?.[0]?.role?.name;
        const access = (0, jwt_1.signAccessToken)({ userId: user.id, role: roleName });
        const tokenId = (0, crypto_1.randomUUID)();
        const refresh = (0, jwt_1.signRefreshToken)({ userId: user.id, tid: tokenId });
        // store refresh hash - tokenId should be hashed for security
        const expiresAt = new Date(Date.now() + ms(env_1.env.REFRESH_EXPIRES_IN));
        const tokenHash = await (0, crypto_2.hashToken)(tokenId);
        await (0, tokenRepo_1.createRefreshToken)({ id: tokenId, userId: user.id, tokenHash, userAgent: params.ua, ip: params.ip, expiresAt });
        try {
            await (0, accountLock_1.recordLoginSuccess)(user.id);
        }
        catch { /* ignore */ }
        return { access, refresh };
    }
    async resendVerification(email) {
        const user = await (0, userRepo_1.findUserByEmail)(email);
        if (!user)
            return; // gizlilik
        if (user.emailVerifiedAt)
            return;
        const code = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + 1000 * 60 * env_1.env.EMAIL_VERIFY_CODE_EXPIRE_MINUTES);
        const tokenHash = await (0, crypto_2.hashToken)(code);
        await database_1.prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
        const verifyLink = `${env_1.env.APP_URL}/verify-email?token=${encodeURIComponent(code)}`;
        await (0, mailer_1.sendEmail)({ to: user.email, subject: 'Verify your email', text: `Click to verify: ${verifyLink}` });
    }
    async verifyEmail(token) {
        // Tüm kullanılmamış ve süresi dolmamış token'ları al
        const tokens = await database_1.prisma.emailVerificationToken.findMany({
            where: { usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        });
        if (!tokens.length)
            throw (0, ApiError_1.badRequest)('Invalid or expired token');
        // Gelen token ile eşleşen token'ı bul
        let matchedToken = null;
        for (const rec of tokens) {
            const ok = await (0, crypto_2.verifyTokenHash)(rec.tokenHash, token);
            if (ok) {
                matchedToken = rec;
                break;
            }
        }
        if (!matchedToken)
            throw (0, ApiError_1.badRequest)('Invalid token');
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({ where: { id: matchedToken.userId }, data: { emailVerifiedAt: new Date() } }),
            database_1.prisma.emailVerificationToken.update({ where: { id: matchedToken.id }, data: { usedAt: new Date() } }),
        ]);
    }
    async refresh(params) {
        const latest = await (0, tokenRepo_1.findLatestRefreshTokenByUser)(params.userId);
        if (!latest || latest.revokedAt)
            throw (0, ApiError_1.unauthorized)('Invalid refresh');
        if (latest.id !== params.refreshTid) {
            // reuse detection → revoke all aktifleri iptal et
            await (0, tokenRepo_1.revokeAllRefreshTokensByUser)(params.userId);
            throw (0, ApiError_1.unauthorized)('Refresh reuse detected');
        }
        // Verify token hash for additional security
        const isValidHash = await (0, crypto_2.verifyTokenHash)(latest.tokenHash, params.refreshTid);
        if (!isValidHash) {
            await (0, tokenRepo_1.revokeAllRefreshTokensByUser)(params.userId);
            throw (0, ApiError_1.unauthorized)('Invalid refresh token hash');
        }
        await (0, tokenRepo_1.revokeRefreshToken)(latest.id);
        // Get user role for new JWT - optimized single query
        const userWithRole = await database_1.prisma.user.findUnique({
            where: { id: params.userId },
            select: {
                roles: {
                    select: { role: { select: { name: true } } },
                    take: 1 // Only get first role for performance
                }
            }
        });
        const roleName = userWithRole?.roles?.[0]?.role?.name;
        const access = (0, jwt_1.signAccessToken)({ userId: params.userId, role: roleName });
        const newTid = (0, crypto_1.randomUUID)();
        const refresh = (0, jwt_1.signRefreshToken)({ userId: params.userId, tid: newTid });
        const expiresAt = new Date(Date.now() + ms(env_1.env.REFRESH_EXPIRES_IN));
        const newTokenHash = await (0, crypto_2.hashToken)(newTid);
        await (0, tokenRepo_1.createRefreshToken)({ id: newTid, userId: params.userId, tokenHash: newTokenHash, userAgent: params.ua, ip: params.ip, expiresAt });
        return { access, refresh };
    }
    async forgotPassword(email) {
        const user = await (0, userRepo_1.findUserByEmail)(email);
        if (!user)
            return; // gizlilik
        try {
            // 4 haneli kod üret
            const code = String(Math.floor(1000 + Math.random() * 9000));
            const expiresAt = new Date(Date.now() + 1000 * 60 * env_1.env.PASSWORD_RESET_CODE_EXPIRE_MINUTES);
            const tokenHash = await (0, crypto_2.hashToken)(code);
            await database_1.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
            await (0, mailer_1.sendEmail)({ to: user.email, subject: 'Your reset code', text: `Reset code: ${code}` });
        }
        catch (error) {
            const { logger } = await Promise.resolve().then(() => __importStar(require('../../../utils/logger')));
            logger.error({ error, email: user.email }, 'Failed to send password reset email');
            // Don't throw error to prevent information disclosure
        }
    }
    async verifyResetCode(email, code) {
        const user = await (0, userRepo_1.findUserByEmail)(email);
        if (!user)
            return false;
        const token = await database_1.prisma.passwordResetToken.findFirst({ where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
        if (!token)
            return false;
        return await (0, crypto_2.verifyTokenHash)(token.tokenHash, code);
    }
    async resetPassword(email, code, newPassword) {
        const user = await (0, userRepo_1.findUserByEmail)(email);
        if (!user)
            throw (0, ApiError_1.badRequest)('Invalid email');
        const token = await database_1.prisma.passwordResetToken.findFirst({ where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
        if (!token || !(await (0, crypto_2.verifyTokenHash)(token.tokenHash, code)))
            throw (0, ApiError_1.badRequest)('Invalid code');
        const password = await (0, crypto_2.hashPassword)(newPassword);
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({ where: { id: user.id }, data: { password } }),
            database_1.prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
        ]);
    }
    verifyRefreshToken(token) {
        const payload = (0, jwt_1.verifyToken)(token, 'refresh');
        if (!payload || payload.typ !== 'refresh' || !payload.userId || !payload.tid)
            return null;
        return { userId: payload.userId, tid: payload.tid };
    }
}
exports.AuthService = AuthService;
function ms(spec) {
    // minimal duration parser: 30d / 900s
    const m = spec.match(/^(\d+)([smhd])$/);
    if (!m)
        return 0;
    const v = Number(m[1]);
    const u = m[2];
    if (u === 's')
        return v * 1000;
    if (u === 'm')
        return v * 60 * 1000;
    if (u === 'h')
        return v * 60 * 60 * 1000;
    if (u === 'd')
        return v * 24 * 60 * 60 * 1000;
    return 0;
}
