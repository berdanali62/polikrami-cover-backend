"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const wallet_controller_1 = require("./controller/wallet.controller");
const validation_1 = require("../../middlewares/validation");
const wallet_dto_1 = require("./dto/wallet.dto");
const walletRateLimit_1 = require("./middlewares/walletRateLimit");
const router = (0, express_1.Router)();
// Middleware wrappers
const authMw = (req, res, next) => {
    void (0, auth_1.requireAuth)(req, res, next);
};
const adminMw = (req, res, next) => {
    void (0, auth_1.requireRole)('admin')(req, res, next);
};
/**
 * @route   GET /api/v1/wallet
 * @desc    Get current credit balance
 * @access  Private
 */
router.get('/', authMw, (0, asyncHandler_1.asyncHandler)(wallet_controller_1.getBalanceController));
/**
 * @route   GET /api/v1/wallet/history
 * @desc    Get transaction history
 * @access  Private
 * @query   page, limit, type
 */
router.get('/history', authMw, (0, validation_1.validateQuery)(wallet_dto_1.historyQuerySchema), (0, asyncHandler_1.asyncHandler)(wallet_controller_1.getHistoryController));
/**
 * @route   GET /api/v1/wallet/stats
 * @desc    Get wallet statistics
 * @access  Private
 */
router.get('/stats', authMw, (0, asyncHandler_1.asyncHandler)(wallet_controller_1.getStatsController));
/**
 * @route   POST /api/v1/wallet/grant
 * @desc    Admin grant credits to user
 * @access  Admin only
 */
router.post('/grant', adminMw, (0, validation_1.validateBody)(wallet_dto_1.grantSchema), (0, asyncHandler_1.asyncHandler)(wallet_controller_1.grantCreditsController));
/**
 * @route   POST /api/v1/wallet/purchase
 * @desc    Purchase credit package
 * @access  Private (rate limited)
 * @rateLimit 5 purchases per hour
 */
router.post('/purchase', authMw, walletRateLimit_1.walletRateLimit, (0, validation_1.validateBody)(wallet_dto_1.purchaseSchema), (0, asyncHandler_1.asyncHandler)(wallet_controller_1.purchaseCreditsController));
exports.default = router;
