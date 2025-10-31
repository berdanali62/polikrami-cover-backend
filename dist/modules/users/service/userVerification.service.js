"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserVerificationService = void 0;
const database_1 = require("../../../config/database");
const env_1 = require("../../../config/env");
const crypto_1 = require("../../../shared/helpers/crypto");
const sms_1 = require("../../../shared/sms/sms");
class UserVerificationService {
    async sendPhoneCode(userId, phone) {
        const code = String(Math.floor(1000 + Math.random() * 9000));
        const expiresAt = new Date(Date.now() + 1000 * 60 * env_1.env.PHONE_VERIFY_CODE_EXPIRE_MINUTES);
        const tokenHash = await (0, crypto_1.hashToken)(code);
        await database_1.prisma.phoneVerificationToken.create({ data: { userId, phone, tokenHash, expiresAt } });
        await (0, sms_1.sendSms)({ to: phone, body: `Doğrulama kodunuz: ${code}` });
        if (process.env.NODE_ENV === 'test') {
            // Store last code in memory for tests (no-op in prod)
            global.__LAST_PHONE_CODE__ = { userId, phone, code };
        }
    }
    async verifyPhoneCode(userId, phone, code) {
        const token = await database_1.prisma.phoneVerificationToken.findFirst({
            where: { userId, phone, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
        if (!token)
            return false;
        const ok = await (0, crypto_1.verifyTokenHash)(token.tokenHash, code);
        if (!ok)
            return false;
        await database_1.prisma.$transaction([
            database_1.prisma.userProfile.upsert({
                where: { userId },
                update: { phone, phoneVerifiedAt: new Date() },
                create: { userId, phone, phoneVerifiedAt: new Date() },
            }),
            database_1.prisma.phoneVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
        ]);
        return true;
    }
}
exports.UserVerificationService = UserVerificationService;
