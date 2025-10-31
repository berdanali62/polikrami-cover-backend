"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailSchema = exports.resendVerificationSchema = void 0;
const zod_1 = require("zod");
exports.resendVerificationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
});
