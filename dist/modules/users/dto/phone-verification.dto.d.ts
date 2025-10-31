import { z } from 'zod';
export declare const sendPhoneCodeSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const verifyPhoneCodeSchema: z.ZodObject<{
    phone: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    phone: string;
}, {
    code: string;
    phone: string;
}>;
export type SendPhoneCodeDto = z.infer<typeof sendPhoneCodeSchema>;
export type VerifyPhoneCodeDto = z.infer<typeof verifyPhoneCodeSchema>;
export declare const firebaseVerifySchema: z.ZodObject<{
    idToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    idToken: string;
}, {
    idToken: string;
}>;
export type FirebaseVerifyDto = z.infer<typeof firebaseVerifySchema>;
