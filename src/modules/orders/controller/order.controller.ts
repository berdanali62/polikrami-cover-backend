import { Request, Response } from 'express';
import { OrderService } from '../service/order.service';
import { env } from '../../../config/env';
import { updateOrderStatusSchema, type UpdateOrderStatusDto, cancelOrderSchema } from '../dto/order.dto';

const service = new OrderService();

export async function listMyOrdersController(req: Request, res: Response) {
  const userId = req.user!.id;
  const orders = await service.listMy(userId);
  res.status(200).json(orders.map(serializeOrder));
}

export async function getOrderController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const order = await service.get(userId, id);
  res.status(200).json(serializeOrder(order));
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
  res.status(200).json(serializeOrder(updated));
}

export async function cancelOrderController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const { reason } = cancelOrderSchema.parse(req.body);
  const canceled = await service.cancel(userId, id, reason);
  res.status(200).json(serializeOrder(canceled));
}

function serializeOrder(order: any) {
  return {
    ...order,
    orderNumber: generateOrderNumber(order.id, order.createdAt),
    paymentStatus: getPaymentStatus(order.payments),
    canPay: order.status === 'pending',
    canCancel: ['pending', 'paid'].includes(order.status),
  };
}

function getPaymentStatus(payments: any[]) {
  if (!payments || payments.length === 0) return 'not_paid';
  
  const latestPayment = payments.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  
  return latestPayment.status;
}

function generateOrderNumber(id: string, createdAt: Date | string): string {
  const dt = new Date(createdAt);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const suffix = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CP-${y}${m}${d}-${suffix}`;
}


