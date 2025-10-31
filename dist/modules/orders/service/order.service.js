"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const database_1 = require("../../../config/database");
const ApiError_1 = require("../../../shared/errors/ApiError");
const client_1 = require("@prisma/client");
class OrderService {
    async listMy(userId) {
        return database_1.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { items: true, payments: true },
        });
    }
    async get(userId, orderId) {
        const order = await database_1.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: { items: true, payments: true },
        });
        if (!order)
            throw (0, ApiError_1.notFound)('Order not found');
        return order;
    }
    async updateStatusForTesting(orderId, status) {
        const order = await database_1.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw (0, ApiError_1.notFound)('Order not found');
        return database_1.prisma.order.update({ where: { id: orderId }, data: { status } });
    }
    async cancel(userId, orderId, reason) {
        const order = await database_1.prisma.order.findFirst({ where: { id: orderId, userId } });
        if (!order)
            throw (0, ApiError_1.notFound)('Order not found');
        if (order.status !== client_1.OrderStatus.pending) {
            // Paid or already canceled/refunded can't be canceled here
            return order;
        }
        return database_1.prisma.order.update({ where: { id: orderId }, data: { status: client_1.OrderStatus.canceled, cancelReason: reason } });
    }
}
exports.OrderService = OrderService;
