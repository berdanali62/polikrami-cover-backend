import { Prisma, Draft } from '@prisma/client';
import { DraftWithRelations } from '../types/draft.type';
export declare class DraftRepository {
    /**
     * Create a new draft
     */
    create(data: Prisma.DraftUncheckedCreateInput | Prisma.DraftCreateInput): Promise<Draft>;
    /**
     * Find draft by ID
     */
    findById(id: string): Promise<Draft | null>;
    /**
     * Find draft with relations
     */
    findWithRelations(id: string): Promise<DraftWithRelations | null>;
    /**
     * Find many drafts with filters
     */
    findMany(params: {
        where?: Prisma.DraftWhereInput;
        orderBy?: Prisma.DraftOrderByWithRelationInput;
        skip?: number;
        take?: number;
        include?: Prisma.DraftInclude;
    }): Promise<Draft[]>;
    /**
     * Update draft
     */
    update(id: string, data: Prisma.DraftUpdateInput): Promise<Draft>;
    /**
     * Delete draft
     */
    delete(id: string): Promise<Draft>;
    /**
     * Count drafts
     */
    count(where?: Prisma.DraftWhereInput): Promise<number>;
    /**
     * Find drafts by user with pagination
     */
    findByUser(userId: string, options?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        data: {
            data: Prisma.JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            method: string;
            step: number;
            messageCardId: string | null;
            shipping: Prisma.JsonValue | null;
            committedAt: Date | null;
            workflowStatus: import(".prisma/client").$Enums.WorkflowStatus;
            revisionCount: number;
            maxRevisions: number;
            assignedDesignerId: string | null;
            aiPromptOriginal: string | null;
            aiPromptFinal: string | null;
            aiSelectedImageId: string | null;
            aiRegenCount: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Find drafts assigned to designer
     */
    findByDesigner(designerId: string, options?: {
        page?: number;
        limit?: number;
        status?: string[];
    }): Promise<{
        data: {
            data: Prisma.JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            method: string;
            step: number;
            messageCardId: string | null;
            shipping: Prisma.JsonValue | null;
            committedAt: Date | null;
            workflowStatus: import(".prisma/client").$Enums.WorkflowStatus;
            revisionCount: number;
            maxRevisions: number;
            assignedDesignerId: string | null;
            aiPromptOriginal: string | null;
            aiPromptFinal: string | null;
            aiSelectedImageId: string | null;
            aiRegenCount: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
