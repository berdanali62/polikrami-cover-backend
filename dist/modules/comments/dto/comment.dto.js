"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentIdParamSchema = exports.projectIdParamSchema = exports.listCommentsSchema = exports.updateCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
/**
 * Create comment schema
 * Supports both text comments and star ratings (for customer reviews)
 */
exports.createCommentSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid({
        message: 'Geçerli bir proje ID (UUID) giriniz.'
    }),
    body: zod_1.z.string()
        .min(1, { message: 'Yorum içeriği boş olamaz.' })
        .max(1000, { message: 'Yorum en fazla 1000 karakter olabilir.' })
        .trim(),
    targetLayerId: zod_1.z.string().uuid({
        message: 'Geçerli bir katman ID (UUID) giriniz.'
    }).optional(),
    // For UI star rating (if enabled in schema)
    rating: zod_1.z.number()
        .int()
        .min(1, { message: 'Değerlendirme en az 1 yıldız olmalıdır.' })
        .max(5, { message: 'Değerlendirme en fazla 5 yıldız olabilir.' })
        .optional()
});
/**
 * Update comment schema
 * Allows partial updates
 */
exports.updateCommentSchema = zod_1.z.object({
    body: zod_1.z.string()
        .min(1, { message: 'Yorum içeriği boş olamaz.' })
        .max(1000, { message: 'Yorum en fazla 1000 karakter olabilir.' })
        .trim()
        .optional(),
    status: zod_1.z.enum(['open', 'resolved'], {
        errorMap: () => ({ message: 'Durum "open" veya "resolved" olmalıdır.' })
    }).optional(),
    rating: zod_1.z.number()
        .int()
        .min(1)
        .max(5)
        .optional()
}).refine(data => Object.keys(data).length > 0, { message: 'En az bir alan güncellenmelidir.' });
/**
 * List comments query schema
 * Supports filtering and pagination
 */
exports.listCommentsSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid({
        message: 'Geçerli bir proje ID giriniz.'
    }).optional(),
    layerId: zod_1.z.string().uuid({
        message: 'Geçerli bir katman ID giriniz.'
    }).optional(),
    status: zod_1.z.enum(['open', 'resolved', 'all'], {
        errorMap: () => ({ message: 'Durum "open", "resolved" veya "all" olmalıdır.' })
    }).default('all'),
    page: zod_1.z.coerce.number()
        .int({ message: 'Sayfa numarası tam sayı olmalıdır.' })
        .min(1, { message: 'Sayfa numarası en az 1 olmalıdır.' })
        .default(1),
    limit: zod_1.z.coerce.number()
        .int({ message: 'Limit tam sayı olmalıdır.' })
        .min(1, { message: 'Limit en az 1 olmalıdır.' })
        .max(100, { message: 'Limit en fazla 100 olabilir.' })
        .default(20)
});
/**
 * Project ID param schema
 * For stats endpoint
 */
exports.projectIdParamSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid({
        message: 'Geçerli bir proje ID giriniz.'
    })
});
/**
 * Comment ID param schema
 */
exports.commentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({
        message: 'Geçerli bir yorum ID giriniz.'
    })
});
