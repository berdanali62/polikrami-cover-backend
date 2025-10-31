"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    phone: zod_1.z.string().max(30).optional().nullable(),
    company: zod_1.z.string().max(100).optional().nullable(),
    address1: zod_1.z.string().max(200).optional().nullable(),
    address2: zod_1.z.string().max(200).optional().nullable(),
    city: zod_1.z.string().max(100).optional().nullable(),
    state: zod_1.z.string().max(100).optional().nullable(),
    postalCode: zod_1.z.string().max(30).optional().nullable(),
    country: zod_1.z.string().max(2).optional().nullable(),
    preferences: zod_1.z.record(zod_1.z.any()).optional().nullable(),
});
