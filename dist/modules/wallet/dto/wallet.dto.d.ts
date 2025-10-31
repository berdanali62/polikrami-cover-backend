import { z } from 'zod';
/**
 * Admin grant credits schema
 */
export declare const grantSchema: z.ZodObject<{
    userId: z.ZodString;
    amount: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    amount: number;
    note?: string | undefined;
}, {
    userId: string;
    amount: number;
    note?: string | undefined;
}>;
/**
 * Credit package types
 */
export declare const CREDIT_PACKAGES: {
    readonly basic: {
        readonly credits: 300;
        readonly price: 5000;
    };
    readonly standard: {
        readonly credits: 500;
        readonly price: 10000;
    };
    readonly premium: {
        readonly credits: 1000;
        readonly price: 20000;
    };
};
/**
 * Purchase credits schema
 */
export declare const purchaseSchema: z.ZodObject<{
    packageType: z.ZodEnum<["basic", "standard", "premium"]>;
}, "strip", z.ZodTypeAny, {
    packageType: "basic" | "standard" | "premium";
}, {
    packageType: "basic" | "standard" | "premium";
}>;
/**
 * History query schema
 */
export declare const historyQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    type: z.ZodDefault<z.ZodEnum<["all", "spend", "refund", "purchase", "gift"]>>;
}, "strip", z.ZodTypeAny, {
    type: "gift" | "all" | "spend" | "refund" | "purchase";
    page: number;
    limit: number;
}, {
    type?: "gift" | "all" | "spend" | "refund" | "purchase" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type GrantDto = z.infer<typeof grantSchema>;
export type PurchaseDto = z.infer<typeof purchaseSchema>;
export type HistoryQueryDto = z.infer<typeof historyQuerySchema>;
