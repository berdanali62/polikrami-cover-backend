"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = void 0;
const zod_1 = require("zod");
exports.changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(8),
    newPassword: zod_1.z
        .string()
        .min(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
        .regex(/[A-Z]/, { message: 'Şifre en az bir büyük harf içermelidir (A-Z).' })
        .regex(/[a-z]/, { message: 'Şifre en az bir küçük harf içermelidir (a-z).' })
        .regex(/\d/, { message: 'Şifre en az bir rakam içermelidir (0-9).' })
        .regex(/[^A-Za-z0-9]/, { message: 'Şifre en az bir özel karakter içermelidir (ör. !@#$%^&*).' }),
    confirmNewPassword: zod_1.z.string(),
})
    .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Yeni şifreler eşleşmiyor.',
    path: ['confirmNewPassword'],
});
