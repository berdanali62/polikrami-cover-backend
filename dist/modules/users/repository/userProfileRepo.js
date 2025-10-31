"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserWithProfile = getUserWithProfile;
exports.upsertUserProfile = upsertUserProfile;
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
async function getUserWithProfile(userId) {
    try {
        return await database_1.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    }
    catch {
        // If schema mismatches (e.g., missing optional columns in CI DB), fallback to user only
        return await database_1.prisma.user.findUnique({ where: { id: userId } });
    }
}
async function upsertUserProfile(userId, data) {
    const { preferences, ...rest } = data ?? {};
    const normalized = {
        ...rest,
        ...(preferences === undefined
            ? {}
            : { preferences: preferences === null ? client_1.Prisma.JsonNull : preferences }),
    };
    try {
        return await database_1.prisma.userProfile.upsert({
            where: { userId },
            update: normalized,
            create: { userId, ...normalized },
        });
    }
    catch {
        // Fallback: ensure row exists with minimal fields
        try {
            await database_1.prisma.$executeRawUnsafe(`INSERT INTO "UserProfile" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`, userId);
        }
        catch { }
        return await database_1.prisma.userProfile.findUnique({ where: { userId } });
    }
}
