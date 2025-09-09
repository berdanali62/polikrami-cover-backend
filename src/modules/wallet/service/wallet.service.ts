import { prisma } from '../../../config/database';

export type CreditTransactionType = 'spend' | 'refund' | 'purchase' | 'gift';

export class WalletService {
  async getOrCreateWallet(userId: string) {
    return prisma.creditWallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
  }

  async increase(userId: string, amount: number, type: CreditTransactionType, note?: string, refId?: string) {
    if (amount <= 0) return;
    await prisma.$transaction([
      prisma.creditWallet.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      }),
      prisma.creditTransaction.create({ data: { userId, delta: amount, type, note, refId } }),
    ]);
  }

  async decrease(userId: string, amount: number, type: CreditTransactionType, note?: string, refId?: string) {
    if (amount <= 0) return;
    // Ensure sufficient funds
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    await prisma.$transaction([
      prisma.creditWallet.update({ where: { userId }, data: { balance: { decrement: amount } } }),
      prisma.creditTransaction.create({ data: { userId, delta: -amount, type, note, refId } }),
    ]);
  }
}

export const walletService = new WalletService();


