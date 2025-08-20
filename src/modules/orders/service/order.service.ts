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
}


