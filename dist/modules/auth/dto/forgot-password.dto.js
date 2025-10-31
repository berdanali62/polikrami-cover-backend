"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.verifyResetCodeSchema = exports.forgotPasswordSchema = void 0;
const zod_1 = require("zod");
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
});
exports.verifyResetCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
    code: zod_1.z.string().regex(/^\d{4}$/, { message: 'Kod 4 haneli olmalıdır (0000-9999).' }),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
    code: zod_1.z.string().regex(/^\d{4}$/, { message: 'Kod 4 haneli olmalıdır (0000-9999).' }),
    password: zod_1.z
        .string()
        .min(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
        .regex(/[A-Z]/, { message: 'Şifre en az bir büyük harf içermelidir (A-Z).' })
        .regex(/[a-z]/, { message: 'Şifre en az bir küçük harf içermelidir (a-z).' })
        .regex(/\d/, { message: 'Şifre en az bir rakam içermelidir (0-9).' })
        .regex(/[^A-Za-z0-9]/, { message: 'Şifre en az bir özel karakter içermelidir (ör. !@#$%^&*).' }),
});
