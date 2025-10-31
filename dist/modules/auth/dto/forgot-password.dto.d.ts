import { z } from 'zod';
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const verifyResetCodeSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
}, {
    code: string;
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
    password: string;
}, {
    code: string;
    email: string;
    password: string;
}>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetCodeDto = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
