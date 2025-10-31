import { z } from 'zod';
export declare const updateProfileSchema: z.ZodObject<{
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address1: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address2: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    postalCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    preferences: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    phone?: string | null | undefined;
    company?: string | null | undefined;
    address1?: string | null | undefined;
    address2?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    postalCode?: string | null | undefined;
    country?: string | null | undefined;
    preferences?: Record<string, any> | null | undefined;
}, {
    phone?: string | null | undefined;
    company?: string | null | undefined;
    address1?: string | null | undefined;
    address2?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    postalCode?: string | null | undefined;
    country?: string | null | undefined;
    preferences?: Record<string, any> | null | undefined;
}>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
