import { prisma } from '../../../config/database';
import { badRequest } from '../../../shared/errors/ApiError';
import { CREDIT_PACKAGES } from '../dto/wallet.dto';

export type CreditTransactionType = 'spend' | 'refund' | 'purchase' | 'gift';

// AI Generation Costs (configurable)
export const AI_COSTS = {
  firstGeneration: 100,
  secondGeneration: 200,
  thirdGeneration: 300,
  additionalGeneration: 400 // 4th and beyond
} as const;

// Welcome bonus for new users
export const WELCOME_BONUS = 500;

export class WalletService {
  /**
   * Get or create wallet for user
   * Automatically gives welcome bonus on first creation
   */
  async getOrCreateWallet(userId: string) {
    const wallet = await prisma.creditWallet.findUnique({
      where: { userId }
    });

    if (wallet) {
      return wallet;
    }

    // First time - give welcome bonus
    return await prisma.$transaction(async (tx) => {
      const newWallet = await tx.creditWallet.create({
        data: {
          userId,
          balance: WELCOME_BONUS
        }
      });

      // Log welcome bonus transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          delta: WELCOME_BONUS,
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
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  /**
   * Get transaction history with pagination and filters
   */
  async getHistory(params: {
    userId: string;
    page: number;
    limit: number;
    type: string;
  }) {
    const { userId, page, limit, type } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type !== 'all') {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.creditTransaction.count({ where })
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
  async increase(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    note?: string,
    refId?: string
  ) {
    if (amount <= 0) {
      throw badRequest('Kredi miktarı pozitif olmalıdır.');
    }

    await prisma.$transaction([
      prisma.creditWallet.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount }
      }),
      prisma.creditTransaction.create({
        data: { userId, delta: amount, type, note, refId }
      })
    ]);
  }

  /**
   * Decrease credits (spend)
   * Throws error if insufficient balance
   */
  async decrease(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    note?: string,
    refId?: string
  ) {
    if (amount <= 0) {
      throw badRequest('Kredi miktarı pozitif olmalıdır.');
    }

    // Ensure sufficient funds
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw badRequest(
        `Yetersiz kredi. Mevcut: ${wallet.balance}, Gerekli: ${amount}`
      );
    }

    await prisma.$transaction([
      prisma.creditWallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
      }),
      prisma.creditTransaction.create({
        data: { userId, delta: -amount, type, note, refId }
      })
    ]);
  }

  /**
   * Calculate AI generation cost based on attempt count
   */
  calculateAiCost(attemptNumber: number): number {
    switch (attemptNumber) {
      case 1:
        return AI_COSTS.firstGeneration;
      case 2:
        return AI_COSTS.secondGeneration;
      case 3:
        return AI_COSTS.thirdGeneration;
      default:
        return AI_COSTS.additionalGeneration;
    }
  }

  /**
   * Charge for AI generation
   * Returns remaining balance
   */
  async chargeForAiGeneration(
    userId: string,
    draftId: string,
    attemptNumber: number
  ): Promise<{ charged: number; remainingBalance: number }> {
    const cost = this.calculateAiCost(attemptNumber);

    await this.decrease(
      userId,
      cost,
      'spend',
      `AI görsel oluşturma (${attemptNumber}. deneme)`,
      draftId
    );

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
  async refundAiGeneration(
    userId: string,
    draftId: string,
    amount: number
  ): Promise<void> {
    await this.increase(
      userId,
      amount,
      'refund',
      'AI görsel oluşturma başarısız - kredi iadesi',
      draftId
    );
  }

  /**
   * Admin grant credits to user
   */
  async grantCredits(params: {
    userId: string;
    amount: number;
    note?: string;
    adminId: string;
  }): Promise<void> {
    const { userId, amount, note, adminId } = params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    });

    if (!user) {
      throw badRequest('Kullanıcı bulunamadı.');
    }

    await this.increase(
      userId,
      amount,
      'gift',
      note || `Admin hediyesi (${adminId})`,
      adminId
    );
  }

  /**
   * Purchase credits (requires payment integration)
   */
  async purchaseCredits(params: {
    userId: string;
    packageType: 'basic' | 'standard' | 'premium';
    orderId: string;
  }): Promise<{ added: number; newBalance: number }> {
    const { userId, packageType, orderId } = params;

    const pkg = CREDIT_PACKAGES[packageType];
    if (!pkg) {
      throw badRequest('Geçersiz paket tipi.');
    }

    // Verify order payment is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, userId: true }
    });

    if (!order) {
      throw badRequest('Sipariş bulunamadı.');
    }

    if (order.userId !== userId) {
      throw badRequest('Bu sipariş size ait değil.');
    }

    if (order.status !== 'paid') {
      throw badRequest('Ödeme henüz tamamlanmadı.');
    }

    // Add credits
    await this.increase(
      userId,
      pkg.credits,
      'purchase',
      `${packageType} paketi satın alındı`,
      orderId
    );

    const wallet = await this.getOrCreateWallet(userId);

    return {
      added: pkg.credits,
      newBalance: wallet.balance
    };
  }

  /**
   * Check if user has sufficient credits
   */
  async hasSufficientCredits(
    userId: string,
    requiredAmount: number
  ): Promise<boolean> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance >= requiredAmount;
  }

  /**
   * Get wallet statistics
   */
  async getStats(userId: string) {
    const [wallet, stats] = await Promise.all([
      this.getOrCreateWallet(userId),
      prisma.creditTransaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { delta: true },
        _count: { id: true }
      })
    ]);

    const statsByType = stats.reduce(
      (acc, stat) => {
        acc[stat.type] = {
          total: stat._sum.delta || 0,
          count: stat._count.id
        };
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    return {
      currentBalance: wallet.balance,
      totalEarned: (statsByType.purchase?.total || 0) + (statsByType.gift?.total || 0),
      totalSpent: Math.abs(statsByType.spend?.total || 0),
      totalRefunded: statsByType.refund?.total || 0,
      transactionCount: stats.reduce((sum, s) => sum + s._count.id, 0)
    };
  }
}

export const walletService = new WalletService();