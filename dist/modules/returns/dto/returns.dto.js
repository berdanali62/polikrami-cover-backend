"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnParamSchema = exports.updateReturnStatusSchema = exports.createReturnSchema = void 0;
const zod_1 = require("zod");
exports.createReturnSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(3),
    note: zod_1.z.string().optional(),
});
exports.updateReturnStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['requested', 'approved', 'rejected', 'received', 'refunded', 'canceled']),
    note: zod_1.z.string().optional(),
});
exports.returnParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
