import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { z } from 'zod';

const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  read: z.enum(['true', 'false', 'all']).default('all')
});

export async function listMyNotificationsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { page, limit, read } = listNotificationsSchema.parse(req.query);
  const skip = (page - 1) * limit;
  
  const where: any = { userId };
  if (read === 'true') where.read = true;
  if (read === 'false') where.read = false;
  
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } })
  ]);
  
  res.status(200).json({
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function markNotificationAsReadController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user!.id;
  
  const notification = await prisma.notification.findUnique({
    where: { id }
  });
  
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  
  if (notification.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  await prisma.notification.update({
    where: { id },
    data: { read: true }
  });
  
  res.status(200).json({ ok: true });
}

export async function markAllAsReadController(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
  
  res.status(200).json({ markedCount: result.count });
}

export async function deleteNotificationController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user!.id;
  
  const notification = await prisma.notification.findUnique({
    where: { id }
  });
  
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  
  if (notification.userId !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  await prisma.notification.delete({ where: { id } });
  res.status(204).send();
}
