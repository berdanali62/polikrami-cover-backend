"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const userProfileRepo_1 = require("../repository/userProfileRepo");
const ApiError_1 = require("../../../shared/errors/ApiError");
const database_1 = require("../../../config/database");
const crypto_1 = require("../../../shared/helpers/crypto");
class UserService {
    async me(userId) {
        const user = await (0, userProfileRepo_1.getUserWithProfile)(userId);
        if (!user)
            throw (0, ApiError_1.notFound)('User not found');
        const p = user.profile ?? null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            profile: p ? {
                phone: p.phone ?? null,
                phoneVerifiedAt: p.phoneVerifiedAt ?? null,
                company: p.company ?? null,
                address1: p.address1 ?? null,
                address2: p.address2 ?? null,
                city: p.city ?? null,
                state: p.state ?? null,
                postalCode: p.postalCode ?? null,
                country: p.country ?? null,
                preferences: p.preferences ?? null,
                isArtist: p.isArtist ?? null,
                specialization: p.specialization ?? null,
                revenueShareAcceptedAt: p.revenueShareAcceptedAt ?? null,
                artistBio: p.artistBio ?? null,
                isAvailable: p.isAvailable ?? null,
                iban: p.iban ?? null,
                behanceUrl: p.behanceUrl ?? null,
                dribbbleUrl: p.dribbbleUrl ?? null,
                linkedinUrl: p.linkedinUrl ?? null,
                websiteUrl: p.websiteUrl ?? null,
            } : null,
        };
    }
    async updateProfile(userId, data) {
        // If phone changed, reset verification flag
        if (typeof data?.phone !== 'undefined') {
            const current = await database_1.prisma.userProfile.findUnique({ where: { userId } });
            const incoming = data.phone ?? null;
            const changed = (current?.phone ?? null) !== incoming;
            if (changed) {
                await database_1.prisma.userProfile.upsert({
                    where: { userId },
                    update: { phone: incoming, phoneVerifiedAt: null },
                    create: { userId, phone: incoming, phoneVerifiedAt: null },
                });
                const next = await database_1.prisma.userProfile.findUnique({ where: { userId } });
                return next;
            }
        }
        const profile = await (0, userProfileRepo_1.upsertUserProfile)(userId, data);
        return profile;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw (0, ApiError_1.notFound)('User not found');
        const ok = await (0, crypto_1.verifyPassword)(user.password, currentPassword);
        if (!ok) {
            return { ok: false, message: 'Mevcut şifre hatalı' };
        }
        const hashed = await (0, crypto_1.hashPassword)(newPassword);
        await database_1.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return { ok: true };
    }
}
exports.UserService = UserService;
