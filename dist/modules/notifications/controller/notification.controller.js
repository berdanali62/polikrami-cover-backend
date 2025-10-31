"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyNotificationsController = listMyNotificationsController;
exports.markNotificationAsReadController = markNotificationAsReadController;
exports.markAllAsReadController = markAllAsReadController;
exports.deleteNotificationController = deleteNotificationController;
const database_1 = require("../../../config/database");
const zod_1 = require("zod");
const listNotificationsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    read: zod_1.z.enum(['true', 'false', 'all']).default('all')
});
async function listMyNotificationsController(req, res) {
    const userId = req.user.id;
    const { page, limit, read } = listNotificationsSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = { userId };
    if (read === 'true')
        where.read = true;
    if (read === 'false')
        where.read = false;
    const [notifications, total, unreadCount] = await Promise.all([
        database_1.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        database_1.prisma.notification.count({ where }),
        database_1.prisma.notification.count({ where: { userId, read: false } })
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
async function markNotificationAsReadController(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const notification = await database_1.prisma.notification.findUnique({
        where: { id }
    });
    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
    }
    await database_1.prisma.notification.update({
        where: { id },
        data: { read: true }
    });
    res.status(200).json({ ok: true });
}
async function markAllAsReadController(req, res) {
    const userId = req.user.id;
    const result = await database_1.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    });
    res.status(200).json({ markedCount: result.count });
}
async function deleteNotificationController(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const notification = await database_1.prisma.notification.findUnique({
        where: { id }
    });
    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
    }
    await database_1.prisma.notification.delete({ where: { id } });
    res.status(204).send();
}
