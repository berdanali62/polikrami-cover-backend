import { Request, Response } from 'express';
import { prisma } from '../../../config/database';

export async function listMessageCardsController(_req: Request, res: Response) {
  const cards = await prisma.messageCard.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });
  res.status(200).json(cards);
}


