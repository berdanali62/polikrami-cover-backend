import { z } from 'zod';
/**
 * Search query schema
 */
export declare const searchQuerySchema: z.ZodObject<{
    q: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    type: z.ZodDefault<z.ZodEnum<["all", "templates", "projects", "designers"]>>;
    category: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "projects" | "all" | "templates" | "designers";
    page: number;
    limit: number;
    q: string;
    category?: string | undefined;
    tag?: string | undefined;
}, {
    type?: "projects" | "all" | "templates" | "designers" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    q?: string | undefined;
}>;
/**
 * Suggestions query schema
 */
export declare const suggestionsQuerySchema: z.ZodObject<{
    q: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    q: string;
}, {
    limit?: number | undefined;
    q?: string | undefined;
}>;
export type SearchQueryDto = z.infer<typeof searchQuerySchema>;
export type SuggestionsQueryDto = z.infer<typeof suggestionsQuerySchema>;
