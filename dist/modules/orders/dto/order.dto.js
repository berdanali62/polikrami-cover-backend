"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrderSchema = exports.updateOrderStatusSchema = void 0;
const zod_1 = require("zod");
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'paid', 'failed', 'canceled', 'refunded']),
});
exports.cancelOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3).max(500).optional(),
});
