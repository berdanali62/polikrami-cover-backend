"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectSchema = exports.regenSchema = exports.generateSchema = void 0;
const zod_1 = require("zod");
exports.generateSchema = zod_1.z.object({
    templateId: zod_1.z.string().optional(),
    fields: zod_1.z.record(zod_1.z.any()).optional(),
    userPrompt: zod_1.z.string().optional(),
    count: zod_1.z.coerce.number().int().min(1).max(6).default(3),
});
exports.regenSchema = zod_1.z.object({
    count: zod_1.z.coerce.number().int().min(1).max(6).default(3),
});
exports.selectSchema = zod_1.z.object({
    imageId: zod_1.z.string().uuid(),
});
