"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalanceController = getBalanceController;
exports.getHistoryController = getHistoryController;
exports.getStatsController = getStatsController;
exports.grantCreditsController = grantCreditsController;
exports.purchaseCreditsController = purchaseCreditsController;
const database_1 = require("../../../config/database");
const wallet_service_1 = require("../service/wallet.service");
const wallet_dto_1 = require("../dto/wallet.dto");
/**
 * Get current balance
 * GET /api/v1/wallet
 */
async function getBalanceController(req, res) {
    const userId = req.user.id;
    const balance = await wallet_service_1.walletService.getBalance(userId);
    res.status(200).json({ balance });
}
/**
 * Get transaction history
 * GET /api/v1/wallet/history?page=1&limit=20&type=all
 */
async function getHistoryController(req, res) {
    const userId = req.user.id;
    const params = wallet_dto_1.historyQuerySchema.parse(req.query);
    const result = await wallet_service_1.walletService.getHistory({
        userId,
        ...params
    });
    res.status(200).json(result);
}
/**
 * Get wallet statistics
 * GET /api/v1/wallet/stats
 */
async function getStatsController(req, res) {
    const userId = req.user.id;
    const stats = await wallet_service_1.walletService.getStats(userId);
    res.status(200).json(stats);
}
/**
 * Admin: Grant credits to user
 * POST /api/v1/wallet/grant
 */
async function grantCreditsController(req, res) {
    const adminId = req.user.id;
    const data = wallet_dto_1.grantSchema.parse(req.body);
    await wallet_service_1.walletService.grantCredits({
        ...data,
        adminId
    });
    res.status(200).json({
        success: true,
        message: 'Kredi başarıyla hediye edildi.'
    });
}
/**
 * Purchase credits
 * POST /api/v1/wallet/purchase
 * NOTE: This should be called AFTER payment is completed
 */
async function purchaseCreditsController(req, res) {
    const userId = req.user.id;
    const data = wallet_dto_1.purchaseSchema.parse(req.body);
    // In real implementation, this should:
    // 1. Create an order
    // 2. Initiate payment
    // 3. After payment success callback, add credits
    // For now, direct credit (INSECURE!)
    // TODO: Integrate with payment flow
    const orderId = 'mock-order-' + Date.now();
    // Create mock order
    await database_1.prisma.order.create({
        data: {
            id: orderId,
            userId,
            status: 'paid', // Mock payment success
            totalCents: 0, // Should be actual price
            currency: 'TRY'
        }
    });
    const result = await wallet_service_1.walletService.purchaseCredits({
        userId,
        packageType: data.packageType,
        orderId
    });
    res.status(200).json(result);
}
