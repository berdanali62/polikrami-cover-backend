"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const order_controller_1 = require("./controller/order.controller");
const validation_1 = require("../../middlewares/validation");
const zod_1 = require("zod");
const order_dto_1 = require("./dto/order.dto");
const router = (0, express_1.Router)();
const idParam = zod_1.z.object({ id: zod_1.z.string().uuid({ message: 'Geçerli bir sipariş ID (UUID) giriniz.' }) });
router.get('/', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(order_controller_1.listMyOrdersController));
router.get('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, asyncHandler_1.asyncHandler)(order_controller_1.getOrderController));
// Test amacıyla manuel durum güncelleme
router.post('/:id/status', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(order_dto_1.updateOrderStatusSchema), (0, asyncHandler_1.asyncHandler)(order_controller_1.updateOrderStatusTestController));
// Sipariş iptali
router.post('/:id/cancel', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(order_dto_1.cancelOrderSchema), (0, asyncHandler_1.asyncHandler)(order_controller_1.cancelOrderController));
exports.default = router;
