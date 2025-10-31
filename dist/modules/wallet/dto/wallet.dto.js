"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyQuerySchema = exports.purchaseSchema = exports.CREDIT_PACKAGES = exports.grantSchema = void 0;
const zod_1 = require("zod");
/**
 * Admin grant credits schema
 */
exports.grantSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid({
        message: 'Geçerli bir kullanıcı ID giriniz.'
    }),
    amount: zod_1.z.coerce.number()
        .int({ message: 'Kredi miktarı tam sayı olmalıdır.' })
        .min(1, { message: 'En az 1 kredi verilmelidir.' })
        .max(10000, { message: 'Tek seferde en fazla 10000 kredi verilebilir.' }),
    note: zod_1.z.string()
        .max(200, { message: 'Not en fazla 200 karakter olabilir.' })
        .optional()
});
/**
 * Credit package types
 */
exports.CREDIT_PACKAGES = {
    basic: { credits: 300, price: 5000 }, // 50 TL
    standard: { credits: 500, price: 10000 }, // 100 TL
    premium: { credits: 1000, price: 20000 } // 200 TL
};
/**
 * Purchase credits schema
 */
exports.purchaseSchema = zod_1.z.object({
    packageType: zod_1.z.enum(['basic', 'standard', 'premium'], {
        errorMap: () => ({ message: 'Geçersiz kredi paketi.' })
    })
});
/**
 * History query schema
 */
exports.historyQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number()
        .int()
        .min(1)
        .default(1),
    limit: zod_1.z.coerce.number()
        .int()
        .min(1)
        .max(100)
        .default(20),
    type: zod_1.z.enum(['all', 'spend', 'refund', 'purchase', 'gift'])
        .default('all')
});
