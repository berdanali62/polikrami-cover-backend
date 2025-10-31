import { z } from 'zod';
/**
 * Create comment schema
 * Supports both text comments and star ratings (for customer reviews)
 */
export declare const createCommentSchema: z.ZodObject<{
    projectId: z.ZodString;
    body: z.ZodString;
    targetLayerId: z.ZodOptional<z.ZodString>;
    rating: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    body: string;
    rating?: number | undefined;
    targetLayerId?: string | undefined;
}, {
    projectId: string;
    body: string;
    rating?: number | undefined;
    targetLayerId?: string | undefined;
}>;
/**
 * Update comment schema
 * Allows partial updates
 */
export declare const updateCommentSchema: z.ZodEffects<z.ZodObject<{
    body: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["open", "resolved"]>>;
    rating: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "open" | "resolved" | undefined;
    rating?: number | undefined;
    body?: string | undefined;
}, {
    status?: "open" | "resolved" | undefined;
    rating?: number | undefined;
    body?: string | undefined;
}>, {
    status?: "open" | "resolved" | undefined;
    rating?: number | undefined;
    body?: string | undefined;
}, {
    status?: "open" | "resolved" | undefined;
    rating?: number | undefined;
    body?: string | undefined;
}>;
/**
 * List comments query schema
 * Supports filtering and pagination
 */
export declare const listCommentsSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    layerId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["open", "resolved", "all"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "all" | "open" | "resolved";
    page: number;
    limit: number;
    projectId?: string | undefined;
    layerId?: string | undefined;
}, {
    status?: "all" | "open" | "resolved" | undefined;
    projectId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    layerId?: string | undefined;
}>;
/**
 * Project ID param schema
 * For stats endpoint
 */
export declare const projectIdParamSchema: z.ZodObject<{
    projectId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string;
}, {
    projectId: string;
}>;
/**
 * Comment ID param schema
 */
export declare const commentIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
export type ListCommentsDto = z.infer<typeof listCommentsSchema>;
export type ProjectIdParamDto = z.infer<typeof projectIdParamSchema>;
export type CommentIdParamDto = z.infer<typeof commentIdParamSchema>;
