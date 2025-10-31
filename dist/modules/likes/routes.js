"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const validation_1 = require("../../middlewares/validation");
const auth_1 = require("../../middlewares/auth");
const likes_dto_1 = require("./dto/likes.dto");
const likes_controller_1 = require("./controller/likes.controller");
const likeRateLimit_1 = require("./middlewares/likeRateLimit");
const router = (0, express_1.Router)();
// Auth middleware wrapper
const authMw = (req, res, next) => {
    void (0, auth_1.requireAuth)(req, res, next);
};
/**
 * @route   POST /api/v1/likes/toggle
 * @desc    Toggle like on a message card
 * @access  Private (requires auth)
 */
router.post('/toggle', authMw, likeRateLimit_1.likeRateLimit, (0, validation_1.validateBody)(likes_dto_1.toggleLikeSchema), (0, asyncHandler_1.asyncHandler)(likes_controller_1.toggleLikeController));
/**
 * @route   GET /api/v1/likes/cards/:id/summary
 * @desc    Get like count for a message card
 * @access  Public
 */
router.get('/cards/:id/summary', (0, validation_1.validateParams)(likes_dto_1.likeSummaryParamsSchema), (0, asyncHandler_1.asyncHandler)(likes_controller_1.getLikeSummaryController));
exports.default = router;
