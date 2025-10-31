import { z } from 'zod';
export declare const createOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
}, {
    name: string;
    slug: string;
}>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
}>;
export declare const addMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    role: string;
}, {
    userId: string;
    role?: string | undefined;
}>;
export declare const updateMemberRoleSchema: z.ZodObject<{
    role: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: string;
}, {
    role: string;
}>;
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
export type AddMemberDto = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
