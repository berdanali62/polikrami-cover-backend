"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wilsonLowerBound = wilsonLowerBound;
exports.getDesignerStats = getDesignerStats;
exports.getDesignersBasic = getDesignersBasic;
exports.buildRecommendedSlate = buildRecommendedSlate;
const database_1 = require("../../../config/database");
function daysSince(d) {
    return Math.floor((Date.now() - d.getTime()) / (24 * 3600 * 1000));
}
function wilsonLowerBound(avgOutOf5, count) {
    if (!count || count <= 0)
        return 0;
    const p = Math.max(0, Math.min(1, avgOutOf5 / 5));
    const z = 1.96; // ~95%
    const z2 = z * z;
    const denom = 1 + z2 / count;
    const num = p + z2 / (2 * count) - z * Math.sqrt((p * (1 - p) + z2 / (4 * count)) / count);
    return num / denom; // 0..1
}
async function getDesignerStats() {
    // Designers by role
    const designers = await database_1.prisma.user.findMany({
        where: { roles: { some: { role: { name: 'designer' } } } },
        select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });
    // recent jobs in 30 days by assignedDesignerId
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const grouped = await database_1.prisma.draft.groupBy({
        by: ['assignedDesignerId'],
        where: { assignedDesignerId: { not: null }, createdAt: { gte: cutoff } },
        _count: { _all: true },
    });
    const jobsMap = new Map();
    for (const g of grouped) {
        if (g.assignedDesignerId)
            jobsMap.set(g.assignedDesignerId, g._count._all);
    }
    // Aggregate ratings from DesignerReview
    const reviews = await database_1.prisma.designerReview.groupBy({
        by: ['designerId'],
        _avg: { rating: true },
        _count: { rating: true },
    });
    const ratingAvgMap = new Map();
    const ratingCountMap = new Map();
    for (const r of reviews) {
        ratingAvgMap.set(r.designerId, (r._avg.rating || 0));
        ratingCountMap.set(r.designerId, r._count.rating);
    }
    const stats = designers.map((u) => {
        const ratingAvg = ratingAvgMap.get(u.id) || 0;
        const ratingCount = ratingCountMap.get(u.id) || 0;
        const recentJobs30d = jobsMap.get(u.id) || 0;
        return { id: u.id, name: u.name ?? null, avatarUrl: u.avatarUrl ?? null, createdAt: u.createdAt, ratingAvg, ratingCount, recentJobs30d };
    });
    return stats;
}
// Basic designer listing for controller consumption
async function getDesignersBasic() {
    const designerUsers = await database_1.prisma.user.findMany({
        where: { roles: { some: { role: { name: 'designer' } } } },
        select: { id: true, name: true, email: true, profile: true }
    });
    return designerUsers;
}
function buildRecommendedSlate(all, slateSize = 3) {
    // define groups
    const topRated = [...all].sort((a, b) => wilsonLowerBound(b.ratingAvg, b.ratingCount) - wilsonLowerBound(a.ratingAvg, a.ratingCount));
    const newOrLow = all.filter((d) => daysSince(d.createdAt) <= 30 || d.ratingCount < 3);
    const underExposed = [...all].sort((a, b) => a.recentJobs30d - b.recentJobs30d);
    const used = new Set();
    const slate = [];
    const fairnessBoost = (d) => Math.max(0, 5 - d.recentJobs30d) * 0.02; // small boost for fewer recent jobs
    const jitter = () => Math.random() * 0.01;
    const scoreTop = (d) => wilsonLowerBound(d.ratingAvg, d.ratingCount) + fairnessBoost(d) + jitter();
    const scoreNew = (d) => (daysSince(d.createdAt) <= 30 ? 0.4 : 0.0) + (d.ratingCount < 3 ? 0.3 : 0) + fairnessBoost(d) + jitter();
    const scoreUnder = (d) => (5 - Math.min(5, d.recentJobs30d)) * 0.06 + jitter();
    const pick = (arr, scorer) => {
        return arr
            .filter((d) => !used.has(d.id))
            .map((d) => ({ d, s: scorer(d) }))
            .sort((x, y) => y.s - x.s)[0]?.d;
    };
    const a = pick(topRated, scoreTop);
    if (a) {
        slate.push(a);
        used.add(a.id);
    }
    const b = pick(newOrLow, scoreNew);
    if (b) {
        slate.push(b);
        used.add(b.id);
    }
    const c = pick(underExposed, scoreUnder);
    if (c) {
        slate.push(c);
        used.add(c.id);
    }
    // backfill if less than slateSize
    const backfill = [...all].filter((d) => !used.has(d.id)).sort((x, y) => scoreTop(y) - scoreTop(x));
    while (slate.length < slateSize && backfill.length)
        slate.push(backfill.shift());
    const rest = [...all].filter((d) => !slate.find((s) => s.id === d.id));
    return { slate, rest };
}
