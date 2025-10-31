"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicProfileController = publicProfileController;
exports.searchDesignersController = searchDesignersController;
const database_1 = require("../../../config/database");
const zod_1 = require("zod");
async function publicProfileController(req, res) {
    const { id } = zod_1.z.object({ id: zod_1.z.string().uuid() }).parse(req.params);
    const user = await database_1.prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            // Public-only profile fields
            profile: {
                select: {
                    artistBio: true,
                    specialization: true,
                    isAvailable: true,
                    behanceUrl: true,
                    dribbbleUrl: true,
                    linkedinUrl: true,
                    websiteUrl: true,
                }
            },
            designerReviewsReceived: { select: { rating: true }, take: 1000 },
        },
    });
    if (!user)
        return res.status(404).json({ message: 'Designer not found' });
    const ratings = user.designerReviewsReceived || [];
    const ratingCount = ratings.length;
    const ratingAvg = ratingCount ? ratings.reduce((s, r) => s + r.rating, 0) / ratingCount : 0;
    res.status(200).json({
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        profile: user.profile,
        rating: { avg: ratingAvg, count: ratingCount },
    });
}
async function searchDesignersController(req, res) {
    const { q, skill, limit } = zod_1.z.object({
        q: zod_1.z.string().optional(),
        skill: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    }).parse(req.query);
    const where = {
        roles: { some: { role: { name: 'designer' } } },
    };
    if (q) {
        where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { profile: { is: { artistBio: { contains: q, mode: 'insensitive' } } } },
        ];
    }
    if (skill) {
        where.profile = { is: { specialization: { contains: skill, mode: 'insensitive' } } };
    }
    const designers = await database_1.prisma.user.findMany({
        where,
        select: { id: true, name: true, avatarUrl: true, profile: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ items: designers });
}
