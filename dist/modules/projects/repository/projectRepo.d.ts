import { ProjectStatus, Prisma } from '@prisma/client';
export declare function listProjectsForUser(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ProjectStatus;
    meta: Prisma.JsonValue | null;
    title: string;
    ownerId: string;
    orgId: string | null;
}[]>;
export declare function createProject(params: {
    ownerId: string;
    title: string;
    orgId?: string;
    meta?: Prisma.InputJsonValue;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ProjectStatus;
    meta: Prisma.JsonValue | null;
    title: string;
    ownerId: string;
    orgId: string | null;
}>;
export declare function getProject(id: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ProjectStatus;
    meta: Prisma.JsonValue | null;
    title: string;
    ownerId: string;
    orgId: string | null;
} | null>;
export declare function updateProject(id: string, data: {
    title?: string;
    status?: ProjectStatus;
    meta?: Prisma.InputJsonValue | null;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ProjectStatus;
    meta: Prisma.JsonValue | null;
    title: string;
    ownerId: string;
    orgId: string | null;
}>;
export declare function softDeleteProject(id: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.ProjectStatus;
    meta: Prisma.JsonValue | null;
    title: string;
    ownerId: string;
    orgId: string | null;
}>;
export declare function addProjectMember(projectId: string, userId: string, role: string): Promise<{
    role: string;
    createdAt: Date;
    userId: string;
    projectId: string;
}>;
export declare function listProjectMembers(projectId: string): Promise<({
    user: {
        email: string;
        password: string;
        name: string | null;
        id: string;
        avatarUrl: string | null;
        emailVerifiedAt: Date | null;
        termsAcceptedAt: Date | null;
        privacyAcceptedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
} & {
    role: string;
    createdAt: Date;
    userId: string;
    projectId: string;
})[]>;
export declare function removeProjectMember(projectId: string, userId: string): Promise<{
    role: string;
    createdAt: Date;
    userId: string;
    projectId: string;
}>;
export declare function getMemberRole(projectId: string, userId: string): Promise<string | null>;
