"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberRoleSchema = exports.addMemberSchema = exports.updateOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = require("zod");
exports.createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    slug: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});
exports.updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    slug: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
});
exports.addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    role: zod_1.z.string().min(2).max(30).default('member'),
});
exports.updateMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.string().min(2).max(30),
});
