"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMemberSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: 'Proje başlığı boş olamaz.' }),
    orgId: zod_1.z.string().uuid({ message: 'Geçerli bir organizasyon ID (UUID) giriniz.' }).optional(),
    meta: zod_1.z.record(zod_1.z.any(), { message: 'Meta bilgisi geçersiz.' }).optional(),
});
exports.updateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: 'Proje başlığı boş olamaz.' }).optional(),
    status: zod_1.z.enum(['active', 'archived', 'deleted'], { message: 'Geçersiz proje durumu.' }).optional(),
    meta: zod_1.z
        .record(zod_1.z.any(), { message: 'Meta bilgisi geçersiz.' })
        .nullable()
        .optional(),
});
exports.addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid({ message: 'Geçerli bir kullanıcı ID (UUID) giriniz.' }),
    role: zod_1.z.string().min(2, { message: 'Rol adı en az 2 karakter olmalıdır.' }).default('editor').optional(),
});
