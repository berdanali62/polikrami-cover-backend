"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessageCardsController = listMessageCardsController;
exports.popularMessageCardsController = popularMessageCardsController;
const database_1 = require("../../../config/database");
const connection_1 = require("../../../queue/connection");
async function listMessageCardsController(_req, res) {
    const cards = await database_1.prisma.messageCard.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });
    res.status(200).json(cards);
}
async function popularMessageCardsController(_req, res) {
    // Try Redis cache first
    try {
        const r = (0, connection_1.createRedisConnection)();
        const cacheKey = 'popular:messageCards';
        const cached = await r?.get(cacheKey);
        if (cached)
            return res.status(200).json(JSON.parse(cached));
        const cards = await database_1.prisma.messageCard.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' }, take: 50 });
        let items = cards.map(c => ({ id: c.id, title: c.title, thumbnailUrl: c.thumbnailUrl, likes: 0 }));
        try {
            const cardIds = cards.map(c => c.id);
            const likes = cardIds.length ? await database_1.prisma.like.groupBy({ by: ['messageCardId'], where: { messageCardId: { in: cardIds } }, _count: { _all: true } }) : [];
            const likeMap = new Map(likes.map(l => [l.messageCardId, l._count._all]));
            items = cards
                .map(c => ({ id: c.id, title: c.title, thumbnailUrl: c.thumbnailUrl, likes: likeMap.get(c.id) || 0 }))
                .sort((a, b) => (b.likes - a.likes) || 0);
        }
        catch {
            // Like table may not exist in test db; fallback with zero likes
        }
        await r?.set(cacheKey, JSON.stringify(items), 'EX', 30);
        return res.status(200).json(items);
    }
    catch { }
    const cards = await database_1.prisma.messageCard.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' }, take: 50 });
    let items = cards.map(c => ({ id: c.id, title: c.title, thumbnailUrl: c.thumbnailUrl, likes: 0 }));
    try {
        const cardIds = cards.map(c => c.id);
        const likes = cardIds.length ? await database_1.prisma.like.groupBy({ by: ['messageCardId'], where: { messageCardId: { in: cardIds } }, _count: { _all: true } }) : [];
        const likeMap = new Map(likes.map(l => [l.messageCardId, l._count._all]));
        items = cards
            .map(c => ({ id: c.id, title: c.title, thumbnailUrl: c.thumbnailUrl, likes: likeMap.get(c.id) || 0 }))
            .sort((a, b) => (b.likes - a.likes) || 0);
    }
    catch { }
    return res.status(200).json(items);
}
