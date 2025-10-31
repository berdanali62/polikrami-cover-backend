"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyReturnsController = listMyReturnsController;
exports.createReturnController = createReturnController;
exports.updateReturnStatusController = updateReturnStatusController;
const database_1 = require("../../../config/database");
const returns_dto_1 = require("../dto/returns.dto");
async function listMyReturnsController(req, res) {
    const userId = req.user.id;
    const items = await database_1.prisma.returnRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.status(200).json({ items });
}
async function createReturnController(req, res) {
    const userId = req.user.id;
    const { orderId, reason, note } = returns_dto_1.createReturnSchema.parse(req.body);
    const order = await database_1.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order)
        return res.status(404).json({ message: 'Order not found' });
    const rr = await database_1.prisma.returnRequest.create({ data: { orderId, userId, reason, note } });
    res.status(201).json(rr);
}
async function updateReturnStatusController(req, res) {
    const { id } = returns_dto_1.returnParamSchema.parse(req.params);
    const { status, note } = returns_dto_1.updateReturnStatusSchema.parse(req.body);
    const rr = await database_1.prisma.returnRequest.update({ where: { id }, data: { status, note } });
    res.status(200).json(rr);
}
