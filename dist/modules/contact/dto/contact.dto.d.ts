import { z } from 'zod';
/**
 * Contact form schema with enhanced validation
 */
export declare const contactSchema: z.ZodObject<{
    name: z.ZodEffects<z.ZodString, string, string>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
    message: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    website: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    captchaToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    email: string;
    name: string;
    phone: string | null;
    website: string;
    captchaToken?: string | undefined;
}, {
    message: string;
    email: string;
    name: string;
    phone?: string | null | undefined;
    website?: string | undefined;
    captchaToken?: string | undefined;
}>;
export type ContactDto = z.infer<typeof contactSchema>;
