"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDesignersController = listDesignersController;
exports.recommendedDesignersController = recommendedDesignersController;
exports.listDesignersSortedController = listDesignersSortedController;
exports.createReviewController = createReviewController;
exports.listReviewsController = listReviewsController;
const database_1 = require("../../../config/database");
const recommendation_service_1 = require("../service/recommendation.service");
const recommendation_service_2 = require("../service/recommendation.service");
const review_dto_1 = require("../dto/review.dto");
async function listDesignersController(_req, res) {
    // Delegate to service function to respect layering
    const designerUsers = await (0, recommendation_service_1.getDesignersBasic)();
    res.status(200).json({ success: true, data: designerUsers });
}
async function recommendedDesignersController(_req, res) {
    const stats = await (0, recommendation_service_2.getDesignerStats)();
    const { slate, rest } = (0, recommendation_service_2.buildRecommendedSlate)(stats, 3);
    res.status(200).json({ success: true, data: { slate, rest } });
}
async function listDesignersSortedController(req, res) {
    const { sort } = review_dto_1.designersListQuerySchema.parse(req.query);
    const stats = await (0, recommendation_service_2.getDesignerStats)();
    if (sort === 'rating') {
        const sorted = stats.sort((a, b) => (b.ratingAvg - a.ratingAvg) || (b.ratingCount - a.ratingCount));
        return res.status(200).json({ success: true, data: { designers: sorted } });
    }
    if (sort === 'newest') {
        const sorted = stats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return res.status(200).json({ success: true, data: { designers: sorted } });
    }
    if (sort === 'active30d') {
        const sorted = stats.sort((a, b) => b.recentJobs30d - a.recentJobs30d);
        return res.status(200).json({ success: true, data: { designers: sorted } });
    }
    // default: recommended
    const { slate, rest } = (0, recommendation_service_2.buildRecommendedSlate)(stats, 3);
    res.status(200).json({ success: true, data: { slate, rest } });
}
async function createReviewController(req, res) {
    const reviewerId = req.user.id;
    const designerId = req.params.id;
    const { rating, comment } = review_dto_1.createReviewSchema.parse(req.body);
    // ensure target is designer role
    const isDesigner = await database_1.prisma.user.findFirst({ where: { id: designerId, roles: { some: { role: { name: 'designer' } } } }, select: { id: true } });
    if (!isDesigner)
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Designer not found' } });
    // upsert by unique(designerId, reviewerId)
    const existing = await database_1.prisma.designerReview.findUnique({ where: { designerId_reviewerId: { designerId, reviewerId } } }).catch(() => null);
    let review;
    if (existing) {
        review = await database_1.prisma.designerReview.update({ where: { designerId_reviewerId: { designerId, reviewerId } }, data: { rating, comment } });
    }
    else {
        review = await database_1.prisma.designerReview.create({ data: { designerId, reviewerId, rating, comment } });
    }
    res.status(201).json({ success: true, data: { id: review.id, rating: review.rating, comment: review.comment } });
}
async function listReviewsController(req, res) {
    const designerId = req.params.id;
    const { page, limit } = review_dto_1.listReviewsQuerySchema.parse(req.query);
    const [items, total] = await Promise.all([
        database_1.prisma.designerReview.findMany({ where: { designerId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        database_1.prisma.designerReview.count({ where: { designerId } }),
    ]);
    res.status(200).json({ success: true, data: { items, total, page, limit } });
}
