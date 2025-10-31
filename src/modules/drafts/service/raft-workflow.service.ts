import { prisma } from '../../../config/database';
import { Draft, WorkflowStatus, Prisma } from '@prisma/client';
import { DraftRepository } from '../repository/draft.repository';
import { DraftValidationService } from './draft-validation.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { badRequest, forbidden } from '../../../shared/errors/ApiError';
import { logger } from '../../../utils/logger';
import { env } from '../../../config/env';

interface WorkflowTransition {
  from: WorkflowStatus[];
  to: WorkflowStatus;
  requiredRole?: 'owner' | 'designer' | 'admin';
  validator?: (draft: Draft) => Promise<boolean> | boolean;
}

// Deprecated typo file; keep class export name intact for compatibility
export class DraftWorkflowService {
  private readonly MAX_REVISIONS = env.MAX_DRAFT_REVISIONS;
  
  private readonly transitions: ReadonlyMap<string, WorkflowTransition> = new Map<string, WorkflowTransition>([
    ['sendPreview', {
      from: [WorkflowStatus.IN_PROGRESS, WorkflowStatus.REVISION],
      to: WorkflowStatus.PREVIEW_SENT,
      requiredRole: 'designer'
    }],
    ['requestRevision', {
      from: [WorkflowStatus.PREVIEW_SENT],
      to: WorkflowStatus.REVISION,
      requiredRole: 'owner',
      validator: (draft: Draft) => this.canRequestRevision(draft)
    }],
    ['approve', {
      from: [WorkflowStatus.PREVIEW_SENT],
      to: WorkflowStatus.COMPLETED,
      requiredRole: 'owner'
    }],
    ['cancel', {
      from: [
        WorkflowStatus.PENDING,
        WorkflowStatus.IN_PROGRESS,
        WorkflowStatus.PREVIEW_SENT,
        WorkflowStatus.REVISION
      ],
      to: WorkflowStatus.CANCELED,
      requiredRole: 'owner'
    }]
  ]);

  constructor(
    private readonly repository = new DraftRepository(),
    private readonly validationService = new DraftValidationService(),
    private readonly notificationService = new NotificationService()
  ) {}

  /**
   * Send preview to customer
   */
  async sendPreview(draftId: string, designerId: string): Promise<Draft> {
    const draft = await this.repository.findWithRelations(draftId);
    
    if (!draft) {
      throw badRequest('Draft not found');
    }
    
    // Validate designer is assigned
    if (draft.assignedDesignerId !== designerId) {
      throw forbidden('Only assigned designer can send preview');
    }
    
    // Validate transition
    await this.validateTransition(draft, 'sendPreview');
    
    // Update workflow status
    const updatedDraft = await this.repository.update(draftId, {
      workflowStatus: WorkflowStatus.PREVIEW_SENT
    });
    
    // Create workflow event
    await this.createWorkflowEvent(draftId, 'preview_sent', designerId);
    
    // Notify customer
    await this.notifyCustomer(draft.userId, 'preview_ready', {
      draftId,
      designerName: draft.assignedDesigner?.name
    });
    
    logger.info({
      draftId,
      designerId,
      previousStatus: draft.workflowStatus,
      newStatus: WorkflowStatus.PREVIEW_SENT
    }, 'Preview sent to customer');
    
    return updatedDraft;
  }

  /**
   * Request revision (customer action)
   */
  async requestRevision(
    draftId: string, 
    userId: string,
    revisionNotes?: string
  ): Promise<Draft> {
    const draft = await this.repository.findWithRelations(draftId);
    
    if (!draft) {
      throw badRequest('Draft not found');
    }
    
    // Validate ownership
    await this.validationService.validateOwnership(draft, userId);
    
    // Validate transition
    await this.validateTransition(draft, 'requestRevision');
    
    // Check revision limit
    if (!this.canRequestRevision(draft)) {
      throw badRequest(
        `Maximum revision limit reached (${this.MAX_REVISIONS} revisions allowed)`
      );
    }
    
    // Update draft with incremented revision count
    const updatedDraft = await this.repository.update(draftId, {
      workflowStatus: WorkflowStatus.REVISION,
      revisionCount: { increment: 1 },
      data: this.appendRevisionNotes(draft.data, revisionNotes)
    });
    
    // Create workflow event
    await this.createWorkflowEvent(draftId, 'revision_requested', userId, {
      revisionNumber: (draft.revisionCount || 0) + 1,
      notes: revisionNotes
    });
    
    // Notify designer
    if (draft.assignedDesignerId) {
      await this.notifyDesigner(draft.assignedDesignerId, 'revision_requested', {
        draftId,
        customerName: draft.user?.name,
        revisionNumber: (draft.revisionCount || 0) + 1,
        notes: revisionNotes
      });
    }
    
    logger.info({
      draftId,
      userId,
      revisionCount: (draft.revisionCount || 0) + 1,
      maxRevisions: this.MAX_REVISIONS
    }, 'Revision requested');
    
    return updatedDraft;
  }

  /**
   * Approve design (customer action)
   */
  async approve(draftId: string, userId: string): Promise<Draft> {
    const draft = await this.repository.findWithRelations(draftId);
    
    if (!draft) {
      throw badRequest('Draft not found');
    }
    
    // Validate ownership
    await this.validationService.validateOwnership(draft, userId);
    
    // Validate transition
    await this.validateTransition(draft, 'approve');
    
    // Update workflow status
    const updatedDraft = await this.repository.update(draftId, {
      workflowStatus: WorkflowStatus.COMPLETED
    });
    
    // Create workflow event
    await this.createWorkflowEvent(draftId, 'approved', userId);
    
    // Notify designer
    if (draft.assignedDesignerId) {
      await this.notifyDesigner(draft.assignedDesignerId, 'design_approved', {
        draftId,
        customerName: draft.user?.name
      });
    }
    
    logger.info({
      draftId,
      userId,
      totalRevisions: draft.revisionCount || 0
    }, 'Design approved');
    
    return updatedDraft;
  }

  /**
   * Cancel draft (customer action)
   */
  async cancel(
    draftId: string, 
    userId: string,
    reason?: string
  ): Promise<Draft> {
    const draft = await this.repository.findWithRelations(draftId);
    
    if (!draft) {
      throw badRequest('Draft not found');
    }
    
    // Validate ownership
    await this.validationService.validateOwnership(draft, userId);
    
    // Check if already in terminal state
    if (this.isTerminalState(draft.workflowStatus)) {
      return draft; // Already in terminal state, no action needed
    }
    
    // Update workflow status
    const updatedDraft = await this.repository.update(draftId, {
      workflowStatus: WorkflowStatus.CANCELED,
      data: this.appendCancellationReason(draft.data, reason)
    });
    
    // Create workflow event
    await this.createWorkflowEvent(draftId, 'canceled', userId, { reason });
    
    // Notify designer if assigned
    if (draft.assignedDesignerId) {
      await this.notifyDesigner(draft.assignedDesignerId, 'draft_canceled', {
        draftId,
        customerName: draft.user?.name,
        reason
      });
    }
    
    logger.info({
      draftId,
      userId,
      previousStatus: draft.workflowStatus,
      reason
    }, 'Draft canceled');
    
    return updatedDraft;
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(draftId: string) {
    return prisma.event.findMany({
      where: {
        type: 'draft_workflow',
        payload: {
          path: ['draftId'],
          equals: draftId
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Get revision details
   */
  async getRevisionDetails(draftId: string) {
    const draft = await this.repository.findById(draftId);
    
    if (!draft) {
      throw badRequest('Draft not found');
    }
    
    const revisionHistory = await prisma.event.findMany({
      where: {
        type: 'draft_workflow',
        AND: [
          { payload: { path: ['draftId'], equals: draftId } },
          { payload: { path: ['event'], equals: 'revision_requested' } }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return {
      currentRevision: draft.revisionCount || 0,
      maxRevisions: draft.maxRevisions || this.MAX_REVISIONS,
      remainingRevisions: Math.max(0, (draft.maxRevisions || this.MAX_REVISIONS) - (draft.revisionCount || 0)),
      history: revisionHistory.map(event => {
        const payload = (event.payload as unknown as Record<string, unknown>) || {};
        return {
          revisionNumber: Number(payload['revisionNumber'] ?? 0),
          requestedAt: event.createdAt,
          notes: typeof payload['notes'] === 'string' ? (payload['notes'] as string) : undefined,
        };
      })
    };
  }

  // Helper methods

  canAssignDesigner(status: WorkflowStatus): boolean {
    return status !== WorkflowStatus.COMPLETED && status !== WorkflowStatus.CANCELED;
  }

  private canRequestRevision(draft: Draft): boolean {
    const currentRevisions = draft.revisionCount || 0;
    const maxRevisions = draft.maxRevisions || this.MAX_REVISIONS;
    return currentRevisions < maxRevisions;
  }

  private isTerminalState(status: WorkflowStatus): boolean {
    return status === WorkflowStatus.COMPLETED || status === WorkflowStatus.CANCELED;
  }

  private async validateTransition(draft: Draft, action: string) {
    const transition = this.transitions.get(action);
    
    if (!transition) {
      throw badRequest('Invalid workflow action');
    }
    
    if (!transition.from.includes(draft.workflowStatus)) {
      throw badRequest(
        `Cannot ${action} from current status: ${draft.workflowStatus}`
      );
    }
    
    if (transition.validator) {
      const isValid = await transition.validator(draft);
      if (!isValid) {
        throw badRequest(`Validation failed for ${action}`);
      }
    }
  }

  private async createWorkflowEvent(
    draftId: string,
    event: string,
    userId: string,
    metadata?: any
  ) {
    try {
      await prisma.event.create({
        data: {
          type: 'draft_workflow',
          userId,
          payload: {
            draftId,
            event,
            ...metadata
          }
        }
      });
    } catch (error) {
      logger.error({ error, draftId, event }, 'Failed to create workflow event');
    }
  }

  private async notifyCustomer(userId: string, type: string, data: any) {
    try {
      await this.notificationService.send({
        userId,
        type: `draft_${type}`,
        payload: data
      });
    } catch (error) {
      logger.error({ error, userId, type }, 'Failed to notify customer');
    }
  }

  private async notifyDesigner(designerId: string, type: string, data: any) {
    try {
      await this.notificationService.send({
        userId: designerId,
        type: `draft_${type}`,
        payload: data
      });
    } catch (error) {
      logger.error({ error, designerId, type }, 'Failed to notify designer');
    }
  }

  private appendRevisionNotes(
    currentData: Prisma.JsonValue | null,
    notes?: string
  ): Prisma.InputJsonValue {
    if (!notes) return currentData as Prisma.InputJsonValue;
    
    const data = (currentData || {}) as any;
    const revisions = data.revisions || [];
    
    revisions.push({
      notes,
      requestedAt: new Date().toISOString()
    });
    
    return {
      ...data,
      revisions
    };
  }

  private appendCancellationReason(
    currentData: Prisma.JsonValue | null,
    reason?: string
  ): Prisma.InputJsonValue {
    if (!reason) return currentData as Prisma.InputJsonValue;
    
    const data = (currentData || {}) as any;
    
    return {
      ...data,
      cancellation: {
        reason,
        canceledAt: new Date().toISOString()
      }
    };
  }
}