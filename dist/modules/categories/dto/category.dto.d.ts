import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
}, {
    name: string;
    slug: string;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
}>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
