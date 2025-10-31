import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    remember: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    remember: boolean;
}, {
    email: string;
    password: string;
    remember?: boolean | undefined;
}>;
export type LoginDto = z.infer<typeof loginSchema>;
