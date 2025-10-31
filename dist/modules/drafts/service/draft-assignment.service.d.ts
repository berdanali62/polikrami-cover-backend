import { PrismaClient } from '@prisma/client';
export declare class DraftAssignmentService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Assign designer to draft with concurrency protection
     */
    assignDesigner(draftId: string, designerId: string, assignedBy: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Unassign designer from draft
     */
    unassignDesigner(draftId: string, unassignedBy: string, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get designer workload
     */
    getDesignerWorkload(designerId: string): Promise<{
        current: number;
        max: number;
        drafts: Array<{
            id: string;
            status: string;
            createdAt: Date;
        }>;
    }>;
    /**
     * Reassign designer with concurrency protection
     */
    reassignDesigner(draftId: string, newDesignerId: string, reassignedBy: string, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
