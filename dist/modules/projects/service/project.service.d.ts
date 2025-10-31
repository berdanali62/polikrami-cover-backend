import { ProjectStatus, type Prisma } from '@prisma/client';
export declare class ProjectService {
    list(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ProjectStatus;
        meta: Prisma.JsonValue | null;
        title: string;
        ownerId: string;
        orgId: string | null;
    }[]>;
    create(ownerId: string, params: {
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
    get(id: string, actorId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ProjectStatus;
        meta: Prisma.JsonValue | null;
        title: string;
        ownerId: string;
        orgId: string | null;
    }>;
    update(id: string, data: {
        title?: string;
        status?: ProjectStatus;
        meta?: Prisma.InputJsonValue | null;
    }, actorId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ProjectStatus;
        meta: Prisma.JsonValue | null;
        title: string;
        ownerId: string;
        orgId: string | null;
    }>;
    delete(id: string, actorId?: string): Promise<void>;
    addMember(projectId: string, userId: string, role: string, actorId?: string): Promise<{
        role: string;
        createdAt: Date;
        userId: string;
        projectId: string;
    }>;
    members(projectId: string, actorId?: string): Promise<({
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
    removeMember(projectId: string, userId: string, actorId?: string): Promise<void>;
}
