import { z } from 'zod';
export declare const createReviewSchema: z.ZodObject<{
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    comment?: string | undefined;
}, {
    rating: number;
    comment?: string | undefined;
}>;
export declare const listReviewsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const designersListQuerySchema: z.ZodObject<{
    sort: z.ZodDefault<z.ZodEnum<["recommended", "rating", "newest", "active30d"]>>;
}, "strip", z.ZodTypeAny, {
    sort: "rating" | "recommended" | "newest" | "active30d";
}, {
    sort?: "rating" | "recommended" | "newest" | "active30d" | undefined;
}>;
