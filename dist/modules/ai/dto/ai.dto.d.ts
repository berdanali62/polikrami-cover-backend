import { z } from 'zod';
export declare const generateSchema: z.ZodObject<{
    templateId: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    userPrompt: z.ZodOptional<z.ZodString>;
    count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    count: number;
    templateId?: string | undefined;
    fields?: Record<string, any> | undefined;
    userPrompt?: string | undefined;
}, {
    templateId?: string | undefined;
    fields?: Record<string, any> | undefined;
    count?: number | undefined;
    userPrompt?: string | undefined;
}>;
export declare const regenSchema: z.ZodObject<{
    count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    count: number;
}, {
    count?: number | undefined;
}>;
export declare const selectSchema: z.ZodObject<{
    imageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    imageId: string;
}, {
    imageId: string;
}>;
