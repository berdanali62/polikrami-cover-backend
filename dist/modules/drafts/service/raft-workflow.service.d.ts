import { Draft, WorkflowStatus, Prisma } from '@prisma/client';
import { DraftRepository } from '../repository/draft.repository';
import { DraftValidationService } from './draft-validation.service';
import { NotificationService } from '../../../shared/services/notification.service';
export declare class DraftWorkflowService {
    private readonly repository;
    private readonly validationService;
    private readonly notificationService;
    private readonly MAX_REVISIONS;
    private readonly transitions;
    constructor(repository?: DraftRepository, validationService?: DraftValidationService, notificationService?: NotificationService);
    /**
     * Send preview to customer
     */
    sendPreview(draftId: string, designerId: string): Promise<Draft>;
    /**
     * Request revision (customer action)
     */
    requestRevision(draftId: string, userId: string, revisionNotes?: string): Promise<Draft>;
    /**
     * Approve design (customer action)
     */
    approve(draftId: string, userId: string): Promise<Draft>;
    /**
     * Cancel draft (customer action)
     */
    cancel(draftId: string, userId: string, reason?: string): Promise<Draft>;
    /**
     * Get workflow history
     */
    getWorkflowHistory(draftId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        type: string;
        projectId: string | null;
        templateId: string | null;
        payload: Prisma.JsonValue | null;
    }[]>;
    /**
     * Get revision details
     */
    getRevisionDetails(draftId: string): Promise<{
        currentRevision: number;
        maxRevisions: number;
        remainingRevisions: number;
        history: {
            revisionNumber: number;
            requestedAt: Date;
            notes: string | undefined;
        }[];
    }>;
    canAssignDesigner(status: WorkflowStatus): boolean;
    private canRequestRevision;
    private isTerminalState;
    private validateTransition;
    private createWorkflowEvent;
    private notifyCustomer;
    private notifyDesigner;
    private appendRevisionNotes;
    private appendCancellationReason;
}
