"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeSummaryParamsSchema = exports.toggleLikeSchema = void 0;
const zod_1 = require("zod");
exports.toggleLikeSchema = zod_1.z.object({
    messageCardId: zod_1.z.string().uuid('Invalid message card ID format'),
});
exports.likeSummaryParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid message card ID format'),
});
