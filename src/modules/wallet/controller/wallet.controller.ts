import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { walletService } from '../service/wallet.service';
import { grantSchema, purchaseSchema, historyQuerySchema } from '../dto/wallet.dto';

/**
 * Get current balance
 * GET /api/v1/wallet
 */
export async function getBalanceController(req: Request, res: Response) {
  const userId = req.user!.id;

  const balance = await walletService.getBalance(userId);

  res.status(200).json({ balance });
}

/**
 * Get transaction history
 * GET /api/v1/wallet/history?page=1&limit=20&type=all
 */
export async function getHistoryController(req: Request, res: Response) {
  const userId = req.user!.id;
  const params = historyQuerySchema.parse(req.query);

  const result = await walletService.getHistory({
    userId,
    ...params
  });

  res.status(200).json(result);
}

/**
 * Get wallet statistics
 * GET /api/v1/wallet/stats
 */
export async function getStatsController(req: Request, res: Response) {
  const userId = req.user!.id;

  const stats = await walletService.getStats(userId);

  res.status(200).json(stats);
}

/**
 * Admin: Grant credits to user
 * POST /api/v1/wallet/grant
 */
export async function grantCreditsController(req: Request, res: Response) {
  const adminId = req.user!.id;
  const data = grantSchema.parse(req.body);

  await walletService.grantCredits({
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
export async function purchaseCreditsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const data = purchaseSchema.parse(req.body);

  // In real implementation, this should:
  // 1. Create an order
  // 2. Initiate payment
  // 3. After payment success callback, add credits

  // For now, direct credit (INSECURE!)
  // TODO: Integrate with payment flow
  const orderId = 'mock-order-' + Date.now();

  // Create mock order
  await prisma.order.create({
    data: {
      id: orderId,
      userId,
      status: 'paid', // Mock payment success
      totalCents: 0, // Should be actual price
      currency: 'TRY'
    }
  });

  const result = await walletService.purchaseCredits({
    userId,
    packageType: data.packageType,
    orderId
  });

  res.status(200).json(result);
}

