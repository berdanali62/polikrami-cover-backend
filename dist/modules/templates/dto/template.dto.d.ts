import { z } from 'zod';
export declare const createTemplateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    cover: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    }, {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    }>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    isPublished: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    isPublished: boolean;
    slug: string;
    cover?: {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    } | undefined;
    description?: string | undefined;
    categoryIds?: number[] | undefined;
    tagIds?: number[] | undefined;
}, {
    title: string;
    slug: string;
    isPublished?: boolean | undefined;
    cover?: {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    } | undefined;
    description?: string | undefined;
    categoryIds?: number[] | undefined;
    tagIds?: number[] | undefined;
}>;
export declare const updateTemplateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    cover: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        width: z.ZodNumber;
        height: z.ZodNumber;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    }, {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    }>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    isPublished: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    isPublished?: boolean | undefined;
    cover?: {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    } | undefined;
    description?: string | undefined;
    slug?: string | undefined;
    categoryIds?: number[] | undefined;
    tagIds?: number[] | undefined;
}, {
    title?: string | undefined;
    isPublished?: boolean | undefined;
    cover?: {
        width: number;
        height: number;
        url: string;
        thumbnailUrl?: string | undefined;
    } | undefined;
    description?: string | undefined;
    slug?: string | undefined;
    categoryIds?: number[] | undefined;
    tagIds?: number[] | undefined;
}>;
export declare const listTemplatesSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "title", "popularity"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    published: z.ZodDefault<z.ZodEnum<["true", "false", "all"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "title" | "popularity";
    sortOrder: "asc" | "desc";
    published: "true" | "false" | "all";
    search?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "title" | "popularity" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    published?: "true" | "false" | "all" | undefined;
}>;
export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
export type ListTemplatesDto = z.infer<typeof listTemplatesSchema>;
