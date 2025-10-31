import { z } from 'zod';
export declare const createReturnSchema: z.ZodObject<{
    orderId: z.ZodString;
    reason: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    orderId: string;
    note?: string | undefined;
}, {
    reason: string;
    orderId: string;
    note?: string | undefined;
}>;
export declare const updateReturnStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["requested", "approved", "rejected", "received", "refunded", "canceled"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "received" | "approved" | "canceled" | "refunded" | "requested" | "rejected";
    note?: string | undefined;
}, {
    status: "received" | "approved" | "canceled" | "refunded" | "requested" | "rejected";
    note?: string | undefined;
}>;
export declare const returnParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
