import { z } from 'zod';
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "paid", "failed", "canceled", "refunded"]>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "canceled" | "paid" | "refunded";
}, {
    status: "pending" | "failed" | "canceled" | "paid" | "refunded";
}>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export declare const cancelOrderSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
