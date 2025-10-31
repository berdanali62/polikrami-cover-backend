"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.designersListQuerySchema = exports.listReviewsQuerySchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(1).max(1000).optional(),
});
exports.listReviewsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
});
exports.designersListQuerySchema = zod_1.z.object({
    sort: zod_1.z.enum(['recommended', 'rating', 'newest', 'active30d']).default('recommended'),
});
