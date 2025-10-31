"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyOrdersController = listMyOrdersController;
exports.getOrderController = getOrderController;
exports.updateOrderStatusTestController = updateOrderStatusTestController;
exports.cancelOrderController = cancelOrderController;
const order_service_1 = require("../service/order.service");
const env_1 = require("../../../config/env");
const order_dto_1 = require("../dto/order.dto");
const service = new order_service_1.OrderService();
async function listMyOrdersController(req, res) {
    const userId = req.user.id;
    const orders = await service.listMy(userId);
    res.status(200).json(orders.map(serializeOrder));
}
async function getOrderController(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const order = await service.get(userId, id);
    res.status(200).json(serializeOrder(order));
}
// Test ortamı için manuel durum güncelleme
async function updateOrderStatusTestController(req, res) {
    // Only allow in non-production or for privileged roles
    if (env_1.env.NODE_ENV === 'production' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    const { status } = order_dto_1.updateOrderStatusSchema.parse(req.body);
    const updated = await service.updateStatusForTesting(id, status);
    res.status(200).json(serializeOrder(updated));
}
async function cancelOrderController(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = order_dto_1.cancelOrderSchema.parse(req.body);
    const canceled = await service.cancel(userId, id, reason);
    res.status(200).json(serializeOrder(canceled));
}
function serializeOrder(order) {
    return {
        ...order,
        orderNumber: generateOrderNumber(order.id, order.createdAt),
        paymentStatus: getPaymentStatus(order.payments),
        canPay: order.status === 'pending',
        canCancel: ['pending', 'paid'].includes(order.status),
    };
}
function getPaymentStatus(payments) {
    if (!payments || payments.length === 0)
        return 'not_paid';
    const latestPayment = payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return latestPayment.status;
}
function generateOrderNumber(id, createdAt) {
    const dt = new Date(createdAt);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const suffix = id.replace(/-/g, '').slice(0, 8).toUpperCase();
    return `CP-${y}${m}${d}-${suffix}`;
}
