"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
    // Login için karmaşıklık şartı uygulanmaz; sadece dolu olmalı
    password: zod_1.z.string().min(1, { message: 'Şifre gerekli.' }),
    remember: zod_1.z.boolean().optional().default(false),
});
