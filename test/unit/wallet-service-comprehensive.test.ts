/**
 * 🎯 KRİTİK SİSTEM: AI Credit System - Kapsamlı Unit Testler
 * 
 * Bu test dosyası, projenin en kritik kısmı olan kredi sistemini test eder.
 * Neden kritik:
 * 1. Finansal işlemler (para/kredi hesaplaması)
 * 2. Business logic (maliyet artışı, limitler)
 * 3. Güvenlik (kredi hırsızlığı önleme)
 * 4. Kullanıcı deneyimi (yetersiz kredi durumları)
 */

import { WalletService, AI_COSTS, WELCOME_BONUS } from '../../src/modules/wallet/service/wallet.service';
import { prisma } from '../../src/config/database';
import { badRequest } from '../../src/shared/errors/ApiError';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    creditWallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    creditTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/shared/errors/ApiError', () => ({
  badRequest: jest.fn().mockImplementation((message: string) => {
    const error = new Error(message);
    error.name = 'BadRequestError';
    throw error;
  }),
}));



describe('🎯 WalletService - AI Credit System (Kritik Sistem)', () => {
  let walletService: WalletService;
  let mockPrisma: any;

  beforeEach(() => {
    walletService = new WalletService();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('💰 AI Cost Calculation (AI Maliyet Hesaplama)', () => {
    it('should calculate correct cost for first generation', () => {
      const cost = walletService.calculateAiCost(1);
      expect(cost).toBe(AI_COSTS.firstGeneration);
      expect(cost).toBe(100);
    });

    it('should calculate correct cost for second generation', () => {
      const cost = walletService.calculateAiCost(2);
      expect(cost).toBe(AI_COSTS.secondGeneration);
      expect(cost).toBe(200);
    });

    it('should calculate correct cost for third generation', () => {
      const cost = walletService.calculateAiCost(3);
      expect(cost).toBe(AI_COSTS.thirdGeneration);
      expect(cost).toBe(300);
    });

    it('should calculate correct cost for additional generations (4th+)', () => {
      const cost4 = walletService.calculateAiCost(4);
      const cost5 = walletService.calculateAiCost(5);
      const cost10 = walletService.calculateAiCost(10);
      
      expect(cost4).toBe(AI_COSTS.additionalGeneration);
      expect(cost5).toBe(AI_COSTS.additionalGeneration);
      expect(cost10).toBe(AI_COSTS.additionalGeneration);
      expect(cost4).toBe(400);
    });

    it('should handle edge case: zero attempt number', () => {
      const cost = walletService.calculateAiCost(0);
      expect(cost).toBe(AI_COSTS.additionalGeneration);
    });

    it('should handle edge case: negative attempt number', () => {
      const cost = walletService.calculateAiCost(-1);
      expect(cost).toBe(AI_COSTS.additionalGeneration);
    });
  });

  describe('🎁 Welcome Bonus System (Hoş Geldin Bonusu)', () => {
    it('should give welcome bonus to new user', async () => {
      const userId = 'user-123';
      const mockWallet = { id: 'wallet-123', userId, balance: WELCOME_BONUS };
      
      // Mock: No existing wallet
      mockPrisma.creditWallet.findUnique.mockResolvedValue(null);
      
      // Mock: Transaction creates wallet and transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          creditWallet: {
            create: jest.fn().mockResolvedValue(mockWallet),
          },
          creditTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const result = await walletService.getOrCreateWallet(userId);

      expect(result).toEqual(mockWallet);
      expect(mockPrisma.creditWallet.findUnique).toHaveBeenCalledWith({
        where: { userId }
      });
    });

    it('should return existing wallet without bonus', async () => {
      const userId = 'user-123';
      const existingWallet = { id: 'wallet-123', userId, balance: 1000 };
      
      mockPrisma.creditWallet.findUnique.mockResolvedValue(existingWallet);

      const result = await walletService.getOrCreateWallet(userId);

      expect(result).toEqual(existingWallet);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should verify welcome bonus amount', () => {
      expect(WELCOME_BONUS).toBe(500);
      expect(WELCOME_BONUS).toBeGreaterThan(0);
    });
  });

  describe('💳 Credit Balance Management (Kredi Bakiye Yönetimi)', () => {
    it('should get current balance correctly', async () => {
      const userId = 'user-123';
      const mockWallet = { id: 'wallet-123', userId, balance: 1500 };
      
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      const balance = await walletService.getBalance(userId);

      expect(balance).toBe(1500);
      expect(mockPrisma.creditWallet.findUnique).toHaveBeenCalledWith({
        where: { userId }
      });
    });

    it('should create wallet if not exists when getting balance', async () => {
      const userId = 'user-123';
      const mockWallet = { id: 'wallet-123', userId, balance: WELCOME_BONUS };
      
      mockPrisma.creditWallet.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          creditWallet: {
            create: jest.fn().mockResolvedValue(mockWallet),
          },
          creditTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const balance = await walletService.getBalance(userId);

      expect(balance).toBe(WELCOME_BONUS);
    });
  });

  describe('📈 Credit Increase Operations (Kredi Artırma İşlemleri)', () => {
    it('should increase credits successfully', async () => {
      const userId = 'user-123';
      const amount = 500;
      const type = 'purchase' as const;
      const note = 'Kredi satın alındı';
      const refId = 'order-123';

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      await walletService.increase(userId, amount, type, note, refId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.creditWallet.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount }
      });
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
        data: { userId, delta: amount, type, note, refId }
      });
    });

    it('should throw error for negative amount', async () => {
      const userId = 'user-123';
      const amount = -100;
      const type = 'purchase' as const;

      // Mock badRequest to throw error
      (badRequest as jest.Mock).mockImplementation((message: string) => {
        throw new Error(message);
      });

      await expect(walletService.increase(userId, amount, type))
        .rejects.toThrow('Kredi miktarı pozitif olmalıdır.');
    });

    it('should throw error for zero amount', async () => {
      const userId = 'user-123';
      const amount = 0;
      const type = 'purchase' as const;

      // Mock badRequest to throw error
      (badRequest as jest.Mock).mockImplementation((message: string) => {
        throw new Error(message);
      });

      await expect(walletService.increase(userId, amount, type))
        .rejects.toThrow('Kredi miktarı pozitif olmalıdır.');
    });

    it('should handle different transaction types', async () => {
      const userId = 'user-123';
      const amount = 100;

      const types = ['purchase', 'gift', 'refund'] as const;
      
      for (const type of types) {
        mockPrisma.$transaction.mockClear();
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

        await walletService.increase(userId, amount, type);

        expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
          data: { userId, delta: amount, type, note: undefined, refId: undefined }
        });
      }
    });
  });

  describe('📉 Credit Decrease Operations (Kredi Azaltma İşlemleri)', () => {
    it('should decrease credits successfully when sufficient balance', async () => {
      const userId = 'user-123';
      const amount = 200;
      const type = 'spend' as const;
      const note = 'AI görsel oluşturma';
      const refId = 'draft-123';

      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      await walletService.decrease(userId, amount, type, note, refId);

      expect(mockPrisma.creditWallet.findUnique).toHaveBeenCalledWith({
        where: { userId }
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.creditWallet.update).toHaveBeenCalledWith({
        where: { userId },
        data: { balance: { decrement: amount } }
      });
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
        data: { userId, delta: -amount, type, note, refId }
      });
    });

    it('should throw error when insufficient balance', async () => {
      const userId = 'user-123';
      const amount = 1000;
      const type = 'spend' as const;

      const mockWallet = { id: 'wallet-123', userId, balance: 500 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      await expect(walletService.decrease(userId, amount, type))
        .rejects.toThrow('Yetersiz kredi. Mevcut: 500, Gerekli: 1000');
    });

    it('should throw error for negative amount', async () => {
      const userId = 'user-123';
      const amount = -100;
      const type = 'spend' as const;

      await expect(walletService.decrease(userId, amount, type))
        .rejects.toThrow('Kredi miktarı pozitif olmalıdır.');
    });

    it('should throw error for zero amount', async () => {
      const userId = 'user-123';
      const amount = 0;
      const type = 'spend' as const;

      await expect(walletService.decrease(userId, amount, type))
        .rejects.toThrow('Kredi miktarı pozitif olmalıdır.');
    });
  });

  describe('🤖 AI Generation Charging (AI Üretim Ücretlendirme)', () => {
    it('should charge correct amount for first generation', async () => {
      const userId = 'user-123';
      const draftId = 'draft-123';
      const attemptNumber = 1;
      const expectedCost = AI_COSTS.firstGeneration;

      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      const result = await walletService.chargeForAiGeneration(userId, draftId, attemptNumber);

      expect(result.charged).toBe(expectedCost);
      expect(result.remainingBalance).toBe(1000 - expectedCost);
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          delta: -expectedCost,
          type: 'spend',
          note: `AI görsel oluşturma (${attemptNumber}. deneme)`,
          refId: draftId
        }
      });
    });

    it('should charge correct amount for second generation', async () => {
      const userId = 'user-123';
      const draftId = 'draft-123';
      const attemptNumber = 2;
      const expectedCost = AI_COSTS.secondGeneration;

      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      const result = await walletService.chargeForAiGeneration(userId, draftId, attemptNumber);

      expect(result.charged).toBe(expectedCost);
      expect(result.remainingBalance).toBe(1000 - expectedCost);
    });

    it('should charge correct amount for third generation', async () => {
      const userId = 'user-123';
      const draftId = 'draft-123';
      const attemptNumber = 3;
      const expectedCost = AI_COSTS.thirdGeneration;

      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      const result = await walletService.chargeForAiGeneration(userId, draftId, attemptNumber);

      expect(result.charged).toBe(expectedCost);
      expect(result.remainingBalance).toBe(1000 - expectedCost);
    });

    it('should charge correct amount for additional generations', async () => {
      const userId = 'user-123';
      const draftId = 'draft-123';
      const attemptNumber = 5;
      const expectedCost = AI_COSTS.additionalGeneration;

      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      const result = await walletService.chargeForAiGeneration(userId, draftId, attemptNumber);

      expect(result.charged).toBe(expectedCost);
      expect(result.remainingBalance).toBe(1000 - expectedCost);
    });

    it('should throw error when insufficient credits for AI generation', async () => {
      const userId = 'user-123';
      const draftId = 'draft-123';
      const attemptNumber = 1;
      const expectedCost = AI_COSTS.firstGeneration;

      const mockWallet = { id: 'wallet-123', userId, balance: 50 }; // Insufficient
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      await expect(walletService.chargeForAiGeneration(userId, draftId, attemptNumber))
        .rejects.toThrow('Yetersiz kredi. Mevcut: 50, Gerekli: 100');
    });
  });

  describe('🔄 AI Generation Refund (AI Üretim İadesi)', () => {
    it('should refund credits when AI generation fails', async () => {
      const userId = 'user-123';
      const draftId = 'draft-123';
      const amount = 200;

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      await walletService.refundAiGeneration(userId, draftId, amount);

      expect(mockPrisma.creditWallet.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount }
      });
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          delta: amount,
          type: 'refund',
          note: 'AI görsel oluşturma başarısız - kredi iadesi',
          refId: draftId
        }
      });
    });
  });

  describe('👑 Admin Credit Granting (Admin Kredi Verme)', () => {
    it('should grant credits to existing user', async () => {
      const userId = 'user-123';
      const amount = 1000;
      const note = 'Admin hediyesi';
      const adminId = 'admin-123';

      const mockUser = { id: userId, name: 'John Doe' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      await walletService.grantCredits({ userId, amount, note, adminId });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, name: true }
      });
      expect(mockPrisma.creditWallet.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount }
      });
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          delta: amount,
          type: 'gift',
          note: note,
          refId: adminId
        }
      });
    });

    it('should throw error when user does not exist', async () => {
      const userId = 'non-existent-user';
      const amount = 1000;
      const adminId = 'admin-123';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(walletService.grantCredits({ userId, amount, adminId }))
        .rejects.toThrow('Kullanıcı bulunamadı.');
    });
  });

  describe('💳 Credit Purchase (Kredi Satın Alma)', () => {
    it('should add credits after successful payment', async () => {
      const userId = 'user-123';
      const packageType = 'basic' as const;
      const orderId = 'order-123';

      const mockOrder = { status: 'paid', userId };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      const mockWallet = { id: 'wallet-123', userId, balance: 1500 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      const result = await walletService.purchaseCredits({ userId, packageType, orderId });

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        select: { status: true, userId: true }
      });
      expect(result.newBalance).toBe(1500);
    });

    it('should throw error when order does not exist', async () => {
      const userId = 'user-123';
      const packageType = 'basic' as const;
      const orderId = 'non-existent-order';

      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(walletService.purchaseCredits({ userId, packageType, orderId }))
        .rejects.toThrow('Sipariş bulunamadı.');
    });

    it('should throw error when order belongs to different user', async () => {
      const userId = 'user-123';
      const packageType = 'basic' as const;
      const orderId = 'order-123';

      const mockOrder = { status: 'paid', userId: 'different-user' };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(walletService.purchaseCredits({ userId, packageType, orderId }))
        .rejects.toThrow('Bu sipariş size ait değil.');
    });

    it('should throw error when payment not completed', async () => {
      const userId = 'user-123';
      const packageType = 'basic' as const;
      const orderId = 'order-123';

      const mockOrder = { status: 'pending', userId };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(walletService.purchaseCredits({ userId, packageType, orderId }))
        .rejects.toThrow('Ödeme henüz tamamlanmadı.');
    });
  });

  describe('✅ Credit Validation (Kredi Doğrulama)', () => {
    it('should return true when user has sufficient credits', async () => {
      const userId = 'user-123';
      const requiredAmount = 500;

      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      const hasCredits = await walletService.hasSufficientCredits(userId, requiredAmount);

      expect(hasCredits).toBe(true);
    });

    it('should return false when user has insufficient credits', async () => {
      const userId = 'user-123';
      const requiredAmount = 1000;

      const mockWallet = { id: 'wallet-123', userId, balance: 500 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      const hasCredits = await walletService.hasSufficientCredits(userId, requiredAmount);

      expect(hasCredits).toBe(false);
    });

    it('should return true when user has exactly required credits', async () => {
      const userId = 'user-123';
      const requiredAmount = 500;

      const mockWallet = { id: 'wallet-123', userId, balance: 500 };
      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);

      const hasCredits = await walletService.hasSufficientCredits(userId, requiredAmount);

      expect(hasCredits).toBe(true);
    });
  });

  describe('📊 Wallet Statistics (Cüzdan İstatistikleri)', () => {
    it('should return correct wallet statistics', async () => {
      const userId = 'user-123';
      const mockWallet = { id: 'wallet-123', userId, balance: 1500 };
      const mockStats = [
        { type: 'purchase', _sum: { delta: 2000 }, _count: { id: 2 } },
        { type: 'spend', _sum: { delta: -500 }, _count: { id: 5 } },
        { type: 'gift', _sum: { delta: 1000 }, _count: { id: 1 } },
        { type: 'refund', _sum: { delta: 200 }, _count: { id: 1 } },
      ];

      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.creditTransaction.groupBy.mockResolvedValue(mockStats);

      const stats = await walletService.getStats(userId);

      expect(stats.currentBalance).toBe(1500);
      expect(stats.totalEarned).toBe(3000); // 2000 + 1000
      expect(stats.totalSpent).toBe(500); // Math.abs(-500)
      expect(stats.totalRefunded).toBe(200);
      expect(stats.transactionCount).toBe(9); // 2 + 5 + 1 + 1
    });

    it('should handle empty transaction history', async () => {
      const userId = 'user-123';
      const mockWallet = { id: 'wallet-123', userId, balance: 500 };
      const mockStats: any[] = [];

      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.creditTransaction.groupBy.mockResolvedValue(mockStats);

      const stats = await walletService.getStats(userId);

      expect(stats.currentBalance).toBe(500);
      expect(stats.totalEarned).toBe(0);
      expect(stats.totalSpent).toBe(0);
      expect(stats.totalRefunded).toBe(0);
      expect(stats.transactionCount).toBe(0);
    });
  });

  describe('🔒 Security & Edge Cases (Güvenlik ve Edge Case\'ler)', () => {
    it('should handle concurrent credit operations safely', async () => {
      const userId = 'user-123';
      const amount = 100;
      const mockWallet = { id: 'wallet-123', userId, balance: 1000 };

      mockPrisma.creditWallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      // Simulate concurrent operations
      const promises = [
        walletService.decrease(userId, amount, 'spend'),
        walletService.decrease(userId, amount, 'spend'),
        walletService.decrease(userId, amount, 'spend'),
      ];

      await Promise.all(promises);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should handle very large credit amounts', async () => {
      const userId = 'user-123';
      const largeAmount = 999999999;
      const type = 'purchase' as const;

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      await walletService.increase(userId, largeAmount, type);

      expect(mockPrisma.creditWallet.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: { balance: { increment: largeAmount } },
        create: { userId, balance: largeAmount }
      });
    });

    it('should handle decimal credit amounts correctly', async () => {
      const userId = 'user-123';
      const decimalAmount = 100.50;
      const type = 'purchase' as const;

      mockPrisma.$transaction.mockImplementation(async (operations: any[]) => {
        // Simulate successful transaction - execute operations directly
        const results = [];
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      });

      await walletService.increase(userId, decimalAmount, type);

      expect(mockPrisma.creditWallet.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: { balance: { increment: decimalAmount } },
        create: { userId, balance: decimalAmount }
      });
    });
  });

  describe('🎯 Business Logic Validation (İş Kuralları Doğrulama)', () => {
    it('should enforce progressive AI cost structure', () => {
      const costs = [
        walletService.calculateAiCost(1),
        walletService.calculateAiCost(2),
        walletService.calculateAiCost(3),
        walletService.calculateAiCost(4),
        walletService.calculateAiCost(5),
      ];

      // Verify progressive cost increase
      expect(costs[0]!).toBeLessThan(costs[1]!);
      expect(costs[1]!).toBeLessThan(costs[2]!);
      expect(costs[2]!).toBeLessThan(costs[3]!);
      expect(costs[3]!).toBe(costs[4]!); // 4th+ should be same
    });

    it('should maintain cost consistency across multiple calls', () => {
      const attemptNumber = 3;
      const cost1 = walletService.calculateAiCost(attemptNumber);
      const cost2 = walletService.calculateAiCost(attemptNumber);
      const cost3 = walletService.calculateAiCost(attemptNumber);

      expect(cost1).toBe(cost2);
      expect(cost2).toBe(cost3);
      expect(cost1).toBe(AI_COSTS.thirdGeneration);
    });

    it('should validate welcome bonus amount is reasonable', () => {
      expect(WELCOME_BONUS).toBeGreaterThan(0);
      expect(WELCOME_BONUS).toBeLessThan(10000); // Reasonable upper limit
      expect(WELCOME_BONUS).toBe(500);
    });

    it('should validate AI cost structure is reasonable', () => {
      expect(AI_COSTS.firstGeneration).toBeGreaterThan(0);
      expect(AI_COSTS.secondGeneration).toBeGreaterThan(AI_COSTS.firstGeneration);
      expect(AI_COSTS.thirdGeneration).toBeGreaterThan(AI_COSTS.secondGeneration);
      expect(AI_COSTS.additionalGeneration).toBeGreaterThanOrEqual(AI_COSTS.thirdGeneration);
    });
  });
});
