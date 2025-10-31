import { z } from 'zod';
export declare const resendVerificationSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
