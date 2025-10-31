"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestionsQuerySchema = exports.searchQuerySchema = void 0;
const zod_1 = require("zod");
/**
 * Search query schema
 */
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z.string()
        .max(100, { message: 'Arama terimi en fazla 100 karakter olabilir.' })
        .transform(val => val.trim())
        .optional()
        .default(''),
    type: zod_1.z.enum(['all', 'templates', 'projects', 'designers'], {
        errorMap: () => ({ message: 'Geçersiz arama tipi.' })
    }).default('all'),
    category: zod_1.z.string()
        .max(50, { message: 'Kategori slug\'ı çok uzun.' })
        .regex(/^[a-z0-9-]+$/, { message: 'Geçersiz kategori slug formatı.' })
        .optional(),
    tag: zod_1.z.string()
        .max(50, { message: 'Tag slug\'ı çok uzun.' })
        .regex(/^[a-z0-9-]+$/, { message: 'Geçersiz tag slug formatı.' })
        .optional(),
    page: zod_1.z.coerce.number()
        .int({ message: 'Sayfa numarası tam sayı olmalıdır.' })
        .min(1, { message: 'Sayfa numarası en az 1 olmalıdır.' })
        .max(100, { message: 'Sayfa numarası en fazla 100 olabilir.' })
        .default(1),
    limit: zod_1.z.coerce.number()
        .int({ message: 'Limit tam sayı olmalıdır.' })
        .min(1, { message: 'Limit en az 1 olmalıdır.' })
        .max(50, { message: 'Limit en fazla 50 olabilir.' })
        .default(20)
});
/**
 * Suggestions query schema
 */
exports.suggestionsQuerySchema = zod_1.z.object({
    q: zod_1.z.string()
        .max(50, { message: 'Arama terimi çok uzun.' })
        .transform(val => val.trim())
        .optional()
        .default(''),
    limit: zod_1.z.coerce.number()
        .int()
        .min(1)
        .max(20)
        .default(10)
});
