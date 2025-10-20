import { prisma } from '../../../config/database';
import { notFound } from '../../../shared/errors/ApiError';
import { OrderStatus } from '@prisma/client';

export class OrderService {
  async listMy(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true },
    });
  }

  async get(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payments: true },
    });
    if (!order) throw notFound('Order not found');
    return order;
  }

  async updateStatusForTesting(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw notFound('Order not found');
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  async cancel(userId: string, orderId: string, reason?: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw notFound('Order not found');
    if (order.status !== OrderStatus.pending) {
      // Paid or already canceled/refunded can't be canceled here
      return order;
    }
    return prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.canceled, cancelReason: reason } });
  }
}


