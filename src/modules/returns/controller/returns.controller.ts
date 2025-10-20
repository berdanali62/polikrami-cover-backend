import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { createReturnSchema, returnParamSchema, updateReturnStatusSchema } from '../dto/returns.dto';

export async function listMyReturnsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const items = await prisma.returnRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  res.status(200).json({ items });
}

export async function createReturnController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { orderId, reason, note } = createReturnSchema.parse(req.body);
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const rr = await prisma.returnRequest.create({ data: { orderId, userId, reason, note } });
  res.status(201).json(rr);
}

export async function updateReturnStatusController(req: Request, res: Response) {
  const { id } = returnParamSchema.parse(req.params);
  const { status, note } = updateReturnStatusSchema.parse(req.body);
  const rr = await prisma.returnRequest.update({ where: { id }, data: { status, note } });
  res.status(200).json(rr);
}


