"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = exports.WalletService = exports.WELCOME_BONUS = exports.AI_COSTS = void 0;
const database_1 = require("../../../config/database");
const ApiError_1 = require("../../../shared/errors/ApiError");
const wallet_dto_1 = require("../dto/wallet.dto");
// AI Generation Costs (configurable)
exports.AI_COSTS = {
    firstGeneration: 100,
    secondGeneration: 200,
    thirdGeneration: 300,
    additionalGeneration: 400 // 4th and beyond
};
// Welcome bonus for new users
exports.WELCOME_BONUS = 500;
class WalletService {
    /**
     * Get or create wallet for user
     * Automatically gives welcome bonus on first creation
     */
    async getOrCreateWallet(userId) {
        const wallet = await database_1.prisma.creditWallet.findUnique({
            where: { userId }
        });
        if (wallet) {
            return wallet;
        }
        // First time - give welcome bonus
        return await database_1.prisma.$transaction(async (tx) => {
            const newWallet = await tx.creditWallet.create({
                data: {
                    userId,
                    balance: exports.WELCOME_BONUS
                }
            });
            // Log welcome bonus transaction
            await tx.creditTransaction.create({
                data: {
                    userId,
                    delta: exports.WELCOME_BONUS,
                    type: 'gift',
                    note: 'Hoş geldin bonusu! 🎉'
                }
            });
            return newWallet;
        });
    }
    /**
     * Get current balance
     */
    async getBalance(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        return wallet.balance;
    }
    /**
     * Get transaction history with pagination and filters
     */
    async getHistory(params) {
        const { userId, page, limit, type } = params;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (type !== 'all') {
            where.type = type;
        }
        const [transactions, total] = await Promise.all([
            database_1.prisma.creditTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.creditTransaction.count({ where })
        ]);
        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Increase credits (purchase, gift, refund)
     */
    async increase(userId, amount, type, note, refId) {
        if (amount <= 0) {
            throw (0, ApiError_1.badRequest)('Kredi miktarı pozitif olmalıdır.');
        }
        await database_1.prisma.$transaction([
            database_1.prisma.creditWallet.upsert({
                where: { userId },
                update: { balance: { increment: amount } },
                create: { userId, balance: amount }
            }),
            database_1.prisma.creditTransaction.create({
                data: { userId, delta: amount, type, note, refId }
            })
        ]);
    }
    /**
     * Decrease credits (spend)
     * Throws error if insufficient balance
     */
    async decrease(userId, amount, type, note, refId) {
        if (amount <= 0) {
            throw (0, ApiError_1.badRequest)('Kredi miktarı pozitif olmalıdır.');
        }
        // Ensure sufficient funds
        const wallet = await this.getOrCreateWallet(userId);
        if (wallet.balance < amount) {
            throw (0, ApiError_1.badRequest)(`Yetersiz kredi. Mevcut: ${wallet.balance}, Gerekli: ${amount}`);
        }
        await database_1.prisma.$transaction([
            database_1.prisma.creditWallet.update({
                where: { userId },
                data: { balance: { decrement: amount } }
            }),
            database_1.prisma.creditTransaction.create({
                data: { userId, delta: -amount, type, note, refId }
            })
        ]);
    }
    /**
     * Calculate AI generation cost based on attempt count
     */
    calculateAiCost(attemptNumber) {
        switch (attemptNumber) {
            case 1:
                return exports.AI_COSTS.firstGeneration;
            case 2:
                return exports.AI_COSTS.secondGeneration;
            case 3:
                return exports.AI_COSTS.thirdGeneration;
            default:
                return exports.AI_COSTS.additionalGeneration;
        }
    }
    /**
     * Charge for AI generation
     * Returns remaining balance
     */
    async chargeForAiGeneration(userId, draftId, attemptNumber) {
        const cost = this.calculateAiCost(attemptNumber);
        await this.decrease(userId, cost, 'spend', `AI görsel oluşturma (${attemptNumber}. deneme)`, draftId);
        const wallet = await this.getOrCreateWallet(userId);
        return {
            charged: cost,
            remainingBalance: wallet.balance
        };
    }
    /**
     * Refund AI generation credits
     * Used when AI generation fails
     */
    async refundAiGeneration(userId, draftId, amount) {
        await this.increase(userId, amount, 'refund', 'AI görsel oluşturma başarısız - kredi iadesi', draftId);
    }
    /**
     * Admin grant credits to user
     */
    async grantCredits(params) {
        const { userId, amount, note, adminId } = params;
        // Verify user exists
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true }
        });
        if (!user) {
            throw (0, ApiError_1.badRequest)('Kullanıcı bulunamadı.');
        }
        await this.increase(userId, amount, 'gift', note || `Admin hediyesi (${adminId})`, adminId);
    }
    /**
     * Purchase credits (requires payment integration)
     */
    async purchaseCredits(params) {
        const { userId, packageType, orderId } = params;
        const pkg = wallet_dto_1.CREDIT_PACKAGES[packageType];
        if (!pkg) {
            throw (0, ApiError_1.badRequest)('Geçersiz paket tipi.');
        }
        // Verify order payment is completed
        const order = await database_1.prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true, userId: true }
        });
        if (!order) {
            throw (0, ApiError_1.badRequest)('Sipariş bulunamadı.');
        }
        if (order.userId !== userId) {
            throw (0, ApiError_1.badRequest)('Bu sipariş size ait değil.');
        }
        if (order.status !== 'paid') {
            throw (0, ApiError_1.badRequest)('Ödeme henüz tamamlanmadı.');
        }
        // Add credits
        await this.increase(userId, pkg.credits, 'purchase', `${packageType} paketi satın alındı`, orderId);
        const wallet = await this.getOrCreateWallet(userId);
        return {
            added: pkg.credits,
            newBalance: wallet.balance
        };
    }
    /**
     * Check if user has sufficient credits
     */
    async hasSufficientCredits(userId, requiredAmount) {
        const wallet = await this.getOrCreateWallet(userId);
        return wallet.balance >= requiredAmount;
    }
    /**
     * Get wallet statistics
     */
    async getStats(userId) {
        const [wallet, stats] = await Promise.all([
            this.getOrCreateWallet(userId),
            database_1.prisma.creditTransaction.groupBy({
                by: ['type'],
                where: { userId },
                _sum: { delta: true },
                _count: { id: true }
            })
        ]);
        const statsByType = stats.reduce((acc, stat) => {
            acc[stat.type] = {
                total: stat._sum.delta || 0,
                count: stat._count.id
            };
            return acc;
        }, {});
        return {
            currentBalance: wallet.balance,
            totalEarned: (statsByType.purchase?.total || 0) + (statsByType.gift?.total || 0),
            totalSpent: Math.abs(statsByType.spend?.total || 0),
            totalRefunded: statsByType.refund?.total || 0,
            transactionCount: stats.reduce((sum, s) => sum + s._count.id, 0)
        };
    }
}
exports.WalletService = WalletService;
exports.walletService = new WalletService();
