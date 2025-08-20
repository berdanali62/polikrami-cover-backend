import { Request, Response } from 'express';
import { OrderService } from '../service/order.service';
import { env } from '../../../config/env';
import { updateOrderStatusSchema, type UpdateOrderStatusDto } from '../dto/order.dto';

const service = new OrderService();

export async function listMyOrdersController(req: Request, res: Response) {
  const userId = req.user!.id;
  const orders = await service.listMy(userId);
  res.status(200).json(orders);
}

export async function getOrderController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const order = await service.get(userId, id);
  res.status(200).json(order);
}

// Test ortamı için manuel durum güncelleme
export async function updateOrderStatusTestController(req: Request, res: Response) {
  // Only allow in non-production or for privileged roles
  if (env.NODE_ENV === 'production' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params as { id: string };
  const { status } = updateOrderStatusSchema.parse(req.body) as UpdateOrderStatusDto;
  const updated = await service.updateStatusForTesting(id, status);
  res.status(200).json(updated);
}


