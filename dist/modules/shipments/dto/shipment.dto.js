"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookProviderSchema = exports.publicTrackingSchema = exports.shipmentIdParamSchema = exports.orderIdParamSchema = exports.createShipmentSchema = void 0;
const zod_1 = require("zod");
/**
 * Create shipment schema
 */
exports.createShipmentSchema = zod_1.z.object({
    carrierCode: zod_1.z.string()
        .min(2, { message: 'Kargo firması kodu en az 2 karakter olmalıdır.' })
        .max(20, { message: 'Kargo firması kodu çok uzun.' })
        .regex(/^[a-z0-9_-]+$/i, { message: 'Geçersiz kargo firması kodu formatı.' }),
    carrierName: zod_1.z.string()
        .max(100, { message: 'Kargo firması adı çok uzun.' })
        .optional(),
    trackingNumber: zod_1.z.string()
        .min(3, { message: 'Takip numarası en az 3 karakter olmalıdır.' })
        .max(50, { message: 'Takip numarası çok uzun.' })
        .regex(/^[A-Z0-9-]+$/i, { message: 'Geçersiz takip numarası formatı.' })
});
/**
 * Order ID param schema
 */
exports.orderIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir sipariş ID giriniz.' })
});
/**
 * Shipment ID param schema
 */
exports.shipmentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir kargo ID giriniz.' })
});
/**
 * Public tracking schema (with optional verification token)
 */
exports.publicTrackingSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir kargo ID giriniz.' }),
    // Optional: Require order email or phone for verification
    verificationToken: zod_1.z.string().optional()
});
/**
 * Webhook provider param
 */
exports.webhookProviderSchema = zod_1.z.object({
    provider: zod_1.z.enum(['mock'], {
        errorMap: () => ({ message: 'Desteklenmeyen kargo sağlayıcısı.' })
    }).optional()
});
