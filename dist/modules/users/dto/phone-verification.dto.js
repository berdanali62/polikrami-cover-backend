"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseVerifySchema = exports.verifyPhoneCodeSchema = exports.sendPhoneCodeSchema = void 0;
/* eslint-disable */
const zod_1 = require("zod");
exports.sendPhoneCodeSchema = zod_1.z.object({
    phone: zod_1.z.string().min(5).max(30),
});
exports.verifyPhoneCodeSchema = zod_1.z.object({
    phone: zod_1.z.string().min(5).max(30),
    code: zod_1.z.string().regex(/^\d{4}$/, { message: 'Kod 4 haneli olmalıdır.' }),
});
exports.firebaseVerifySchema = zod_1.z.object({
    idToken: zod_1.z.string().min(20),
});
