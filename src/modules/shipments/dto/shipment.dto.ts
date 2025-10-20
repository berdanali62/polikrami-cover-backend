import { z } from 'zod';

/**
 * Create shipment schema
 */
export const createShipmentSchema = z.object({
  carrierCode: z.string()
    .min(2, { message: 'Kargo firması kodu en az 2 karakter olmalıdır.' })
    .max(20, { message: 'Kargo firması kodu çok uzun.' })
    .regex(/^[a-z0-9_-]+$/i, { message: 'Geçersiz kargo firması kodu formatı.' }),
  
  carrierName: z.string()
    .max(100, { message: 'Kargo firması adı çok uzun.' })
    .optional(),
  
  trackingNumber: z.string()
    .min(3, { message: 'Takip numarası en az 3 karakter olmalıdır.' })
    .max(50, { message: 'Takip numarası çok uzun.' })
    .regex(/^[A-Z0-9-]+$/i, { message: 'Geçersiz takip numarası formatı.' })
});

/**
 * Order ID param schema
 */
export const orderIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Geçerli bir sipariş ID giriniz.' })
});

/**
 * Shipment ID param schema
 */
export const shipmentIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Geçerli bir kargo ID giriniz.' })
});

/**
 * Public tracking schema (with optional verification token)
 */
export const publicTrackingSchema = z.object({
  id: z.string().uuid({ message: 'Geçerli bir kargo ID giriniz.' }),
  // Optional: Require order email or phone for verification
  verificationToken: z.string().optional()
});

/**
 * Webhook provider param
 */
export const webhookProviderSchema = z.object({
  provider: z.enum(['mock'], {
    errorMap: () => ({ message: 'Desteklenmeyen kargo sağlayıcısı.' })
  }).optional()
});

// Type exports
export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;
export type OrderIdParamDto = z.infer<typeof orderIdParamSchema>;
export type ShipmentIdParamDto = z.infer<typeof shipmentIdParamSchema>;
export type PublicTrackingDto = z.infer<typeof publicTrackingSchema>;
export type WebhookProviderDto = z.infer<typeof webhookProviderSchema>;