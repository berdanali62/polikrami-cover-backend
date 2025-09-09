import { Request, Response } from 'express';
import { prisma } from '../../../config/database';

export async function getBalanceController(req: Request, res: Response) {
  const userId = req.user!.id;
  const wallet = await prisma.creditWallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
  res.status(200).json({ balance: wallet.balance });
}

export async function getHistoryController(req: Request, res: Response) {
  const userId = req.user!.id;
  const txs = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.status(200).json({ transactions: txs });
}

export async function grantCreditsController(req: Request, res: Response) {
  const { userId, amount, note } = req.body as { userId: string; amount: number; note?: string };
  await prisma.$transaction([
    prisma.creditWallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount },
    }),
    prisma.creditTransaction.create({ data: { userId, delta: amount, type: 'gift', note } }),
  ]);
  res.status(204).send();
}

export async function purchaseCreditsController(req: Request, res: Response) {
  // Stub: integrate with payments; for now, directly credit for the selected pack
  const userId = req.user!.id;
  const { pack } = req.body as { pack: '300' | '500' | '1000' };
  const credits = pack === '300' ? 300 : pack === '500' ? 500 : 1000;
  await prisma.$transaction([
    prisma.creditWallet.upsert({
      where: { userId },
      update: { balance: { increment: credits } },
      create: { userId, balance: credits },
    }),
    prisma.creditTransaction.create({ data: { userId, delta: credits, type: 'purchase', note: `pack:${pack}` } }),
  ]);
  res.status(200).json({ added: credits });
}


