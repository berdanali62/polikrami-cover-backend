import { z } from 'zod';
/**
 * Create shipment schema
 */
export declare const createShipmentSchema: z.ZodObject<{
    carrierCode: z.ZodString;
    carrierName: z.ZodOptional<z.ZodString>;
    trackingNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    carrierCode: string;
    trackingNumber: string;
    carrierName?: string | undefined;
}, {
    carrierCode: string;
    trackingNumber: string;
    carrierName?: string | undefined;
}>;
/**
 * Order ID param schema
 */
export declare const orderIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Shipment ID param schema
 */
export declare const shipmentIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Public tracking schema (with optional verification token)
 */
export declare const publicTrackingSchema: z.ZodObject<{
    id: z.ZodString;
    verificationToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    verificationToken?: string | undefined;
}, {
    id: string;
    verificationToken?: string | undefined;
}>;
/**
 * Webhook provider param
 */
export declare const webhookProviderSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["mock"]>>;
}, "strip", z.ZodTypeAny, {
    provider?: "mock" | undefined;
}, {
    provider?: "mock" | undefined;
}>;
export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;
export type OrderIdParamDto = z.infer<typeof orderIdParamSchema>;
export type ShipmentIdParamDto = z.infer<typeof shipmentIdParamSchema>;
export type PublicTrackingDto = z.infer<typeof publicTrackingSchema>;
export type WebhookProviderDto = z.infer<typeof webhookProviderSchema>;
