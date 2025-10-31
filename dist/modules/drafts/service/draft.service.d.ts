import { Prisma, Draft } from '@prisma/client';
import { DraftRepository } from '../repository/draft.repository';
import { DraftWorkflowService } from './draft-workflow.service';
import { DraftUploadService } from './draft-upload.service';
import { DraftValidationService } from './draft-validation.service';
import { CreateDraftInput, UpdateDraftInput, SetMessageCardInput, SetShippingInput, DraftWithRelations } from '../types/draft.type';
export declare class DraftService {
    private readonly repository;
    private readonly workflowService;
    private readonly uploadService;
    private readonly validationService;
    constructor(repository?: DraftRepository, workflowService?: DraftWorkflowService, uploadService?: DraftUploadService, validationService?: DraftValidationService);
    /**
     * Create a new draft
     */
    create(userId: string, input: CreateDraftInput): Promise<Draft>;
    /**
     * List user's drafts with pagination
     */
    list(userId: string, options?: {
        page?: number;
        limit?: number;
        includeRelations?: boolean;
    }): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        method: string;
        step: number;
        data: Prisma.JsonValue | null;
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
    }[]>;
    /**
     * Get single draft with ownership validation
     */
    get(id: string, actorId?: string): Promise<DraftWithRelations>;
    /**
     * Update draft with validation
     */
    update(id: string, input: UpdateDraftInput, actorId?: string): Promise<Draft>;
    /**
     * Assign designer to draft
     */
    assignDesigner(id: string, designerId: string, actorId?: string): Promise<Draft>;
    /**
     * Set message card for draft
     */
    setMessageCard(id: string, input: SetMessageCardInput, actorId?: string): Promise<Draft>;
    /**
     * Set shipping information
     */
    setShipping(id: string, input: SetShippingInput, actorId?: string): Promise<Draft>;
    /**
     * Set shipping information from a saved Address record (snapshot only)
     * Does NOT persist anything to Address table; copies fields into draft.shipping
     */
    setShippingFromAddressId(id: string, addressId: string, actorId?: string): Promise<Draft>;
    /**
     * Set ephemeral billing address for checkout. If sameAsShipping=true,
     * derive billing from current draft.shipping. Stored under draft.data.billing.
     */
    setBillingAddress(id: string, input: {
        sameAsShipping?: boolean;
        billing?: Record<string, unknown>;
    }, actorId?: string): Promise<Draft>;
    /**
     * Commit draft to order
     */
    commit(id: string, userId: string): Promise<any>;
    /**
     * Get presigned upload URL
     */
    getUploadUrl(id: string, contentType?: string): Promise<{
        url: string;
        method: "POST";
        key: string;
        contentType: string;
        maxSizeMB: number;
        fields: {
            key: string;
        };
    }>;
    private canCommit;
    private calculateTotalPrice;
    private notifyDesigner;
    private handlePostCommit;
}
