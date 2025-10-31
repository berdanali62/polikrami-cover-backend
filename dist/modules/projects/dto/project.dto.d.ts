import { z } from 'zod';
export declare const createProjectSchema: z.ZodObject<{
    title: z.ZodString;
    orgId: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    orgId?: string | undefined;
    meta?: Record<string, any> | undefined;
}, {
    title: string;
    orgId?: string | undefined;
    meta?: Record<string, any> | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "archived", "deleted"]>>;
    meta: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "archived" | "deleted" | undefined;
    title?: string | undefined;
    meta?: Record<string, any> | null | undefined;
}, {
    status?: "active" | "archived" | "deleted" | undefined;
    title?: string | undefined;
    meta?: Record<string, any> | null | undefined;
}>;
export declare const addMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    role?: string | undefined;
}, {
    userId: string;
    role?: string | undefined;
}>;
export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type AddMemberDto = z.infer<typeof addMemberSchema>;
