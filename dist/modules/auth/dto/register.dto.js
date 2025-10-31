"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
    password: zod_1.z
        .string()
        .min(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
        .regex(/[A-Z]/, { message: 'Şifre en az bir büyük harf içermelidir (A-Z).' })
        .regex(/[a-z]/, { message: 'Şifre en az bir küçük harf içermelidir (a-z).' })
        .regex(/\d/, { message: 'Şifre en az bir rakam içermelidir (0-9).' })
        .regex(/[^A-Za-z0-9]/, { message: 'Şifre en az bir özel karakter içermelidir (ör. !@#$%^&*).' }),
    confirmPassword: zod_1.z.string({ required_error: 'Lütfen şifrenizi tekrar giriniz.' }),
    name: zod_1.z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }).max(100, { message: 'İsim en fazla 100 karakter olabilir.' }).optional(),
    role: zod_1.z.enum(['user', 'designer'], { message: 'Geçersiz rol seçimi.' }).optional().default('user'),
    acceptTerms: zod_1.z.boolean().refine((v) => v === true, { message: 'Kullanım şartlarını kabul etmelisiniz.' }),
    acceptPrivacy: zod_1.z.boolean().refine((v) => v === true, { message: 'Gizlilik sözleşmesini kabul etmelisiniz.' }),
    acceptRevenueShare: zod_1.z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor. Lütfen aynı şifreyi tekrar giriniz.',
    path: ['confirmPassword'],
});
