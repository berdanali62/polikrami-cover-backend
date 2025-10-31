import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<["user", "designer"]>>>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    acceptPrivacy: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    acceptRevenueShare: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    confirmPassword: string;
    role: "user" | "designer";
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    name?: string | undefined;
    acceptRevenueShare?: boolean | undefined;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    name?: string | undefined;
    role?: "user" | "designer" | undefined;
    acceptRevenueShare?: boolean | undefined;
}>, {
    email: string;
    password: string;
    confirmPassword: string;
    role: "user" | "designer";
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    name?: string | undefined;
    acceptRevenueShare?: boolean | undefined;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    name?: string | undefined;
    role?: "user" | "designer" | undefined;
    acceptRevenueShare?: boolean | undefined;
}>;
export type RegisterDto = z.infer<typeof registerSchema>;
