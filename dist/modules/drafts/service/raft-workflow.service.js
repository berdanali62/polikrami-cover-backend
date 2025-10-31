"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftWorkflowService = void 0;
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
const draft_repository_1 = require("../repository/draft.repository");
const draft_validation_service_1 = require("./draft-validation.service");
const notification_service_1 = require("../../../shared/services/notification.service");
const ApiError_1 = require("../../../shared/errors/ApiError");
const logger_1 = require("../../../utils/logger");
const env_1 = require("../../../config/env");
// Deprecated typo file; keep class export name intact for compatibility
class DraftWorkflowService {
    repository;
    validationService;
    notificationService;
    MAX_REVISIONS = env_1.env.MAX_DRAFT_REVISIONS;
    transitions = new Map([
        ['sendPreview', {
                from: [client_1.WorkflowStatus.IN_PROGRESS, client_1.WorkflowStatus.REVISION],
                to: client_1.WorkflowStatus.PREVIEW_SENT,
                requiredRole: 'designer'
            }],
        ['requestRevision', {
                from: [client_1.WorkflowStatus.PREVIEW_SENT],
                to: client_1.WorkflowStatus.REVISION,
                requiredRole: 'owner',
                validator: (draft) => this.canRequestRevision(draft)
            }],
        ['approve', {
                from: [client_1.WorkflowStatus.PREVIEW_SENT],
                to: client_1.WorkflowStatus.COMPLETED,
                requiredRole: 'owner'
            }],
        ['cancel', {
                from: [
                    client_1.WorkflowStatus.PENDING,
                    client_1.WorkflowStatus.IN_PROGRESS,
                    client_1.WorkflowStatus.PREVIEW_SENT,
                    client_1.WorkflowStatus.REVISION
                ],
                to: client_1.WorkflowStatus.CANCELED,
                requiredRole: 'owner'
            }]
    ]);
    constructor(repository = new draft_repository_1.DraftRepository(), validationService = new draft_validation_service_1.DraftValidationService(), notificationService = new notification_service_1.NotificationService()) {
        this.repository = repository;
        this.validationService = validationService;
        this.notificationService = notificationService;
    }
    /**
     * Send preview to customer
     */
    async sendPreview(draftId, designerId) {
        const draft = await this.repository.findWithRelations(draftId);
        if (!draft) {
            throw (0, ApiError_1.badRequest)('Draft not found');
        }
        // Validate designer is assigned
        if (draft.assignedDesignerId !== designerId) {
            throw (0, ApiError_1.forbidden)('Only assigned designer can send preview');
        }
        // Validate transition
        await this.validateTransition(draft, 'sendPreview');
        // Update workflow status
        const updatedDraft = await this.repository.update(draftId, {
            workflowStatus: client_1.WorkflowStatus.PREVIEW_SENT
        });
        // Create workflow event
        await this.createWorkflowEvent(draftId, 'preview_sent', designerId);
        // Notify customer
        await this.notifyCustomer(draft.userId, 'preview_ready', {
            draftId,
            designerName: draft.assignedDesigner?.name
        });
        logger_1.logger.info({
            draftId,
            designerId,
            previousStatus: draft.workflowStatus,
            newStatus: client_1.WorkflowStatus.PREVIEW_SENT
        }, 'Preview sent to customer');
        return updatedDraft;
    }
    /**
     * Request revision (customer action)
     */
    async requestRevision(draftId, userId, revisionNotes) {
        const draft = await this.repository.findWithRelations(draftId);
        if (!draft) {
            throw (0, ApiError_1.badRequest)('Draft not found');
        }
        // Validate ownership
        await this.validationService.validateOwnership(draft, userId);
        // Validate transition
        await this.validateTransition(draft, 'requestRevision');
        // Check revision limit
        if (!this.canRequestRevision(draft)) {
            throw (0, ApiError_1.badRequest)(`Maximum revision limit reached (${this.MAX_REVISIONS} revisions allowed)`);
        }
        // Update draft with incremented revision count
        const updatedDraft = await this.repository.update(draftId, {
            workflowStatus: client_1.WorkflowStatus.REVISION,
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
        logger_1.logger.info({
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
    async approve(draftId, userId) {
        const draft = await this.repository.findWithRelations(draftId);
        if (!draft) {
            throw (0, ApiError_1.badRequest)('Draft not found');
        }
        // Validate ownership
        await this.validationService.validateOwnership(draft, userId);
        // Validate transition
        await this.validateTransition(draft, 'approve');
        // Update workflow status
        const updatedDraft = await this.repository.update(draftId, {
            workflowStatus: client_1.WorkflowStatus.COMPLETED
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
        logger_1.logger.info({
            draftId,
            userId,
            totalRevisions: draft.revisionCount || 0
        }, 'Design approved');
        return updatedDraft;
    }
    /**
     * Cancel draft (customer action)
     */
    async cancel(draftId, userId, reason) {
        const draft = await this.repository.findWithRelations(draftId);
        if (!draft) {
            throw (0, ApiError_1.badRequest)('Draft not found');
        }
        // Validate ownership
        await this.validationService.validateOwnership(draft, userId);
        // Check if already in terminal state
        if (this.isTerminalState(draft.workflowStatus)) {
            return draft; // Already in terminal state, no action needed
        }
        // Update workflow status
        const updatedDraft = await this.repository.update(draftId, {
            workflowStatus: client_1.WorkflowStatus.CANCELED,
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
        logger_1.logger.info({
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
    async getWorkflowHistory(draftId) {
        return database_1.prisma.event.findMany({
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
    async getRevisionDetails(draftId) {
        const draft = await this.repository.findById(draftId);
        if (!draft) {
            throw (0, ApiError_1.badRequest)('Draft not found');
        }
        const revisionHistory = await database_1.prisma.event.findMany({
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
                const payload = event.payload || {};
                return {
                    revisionNumber: Number(payload['revisionNumber'] ?? 0),
                    requestedAt: event.createdAt,
                    notes: typeof payload['notes'] === 'string' ? payload['notes'] : undefined,
                };
            })
        };
    }
    // Helper methods
    canAssignDesigner(status) {
        return status !== client_1.WorkflowStatus.COMPLETED && status !== client_1.WorkflowStatus.CANCELED;
    }
    canRequestRevision(draft) {
        const currentRevisions = draft.revisionCount || 0;
        const maxRevisions = draft.maxRevisions || this.MAX_REVISIONS;
        return currentRevisions < maxRevisions;
    }
    isTerminalState(status) {
        return status === client_1.WorkflowStatus.COMPLETED || status === client_1.WorkflowStatus.CANCELED;
    }
    async validateTransition(draft, action) {
        const transition = this.transitions.get(action);
        if (!transition) {
            throw (0, ApiError_1.badRequest)('Invalid workflow action');
        }
        if (!transition.from.includes(draft.workflowStatus)) {
            throw (0, ApiError_1.badRequest)(`Cannot ${action} from current status: ${draft.workflowStatus}`);
        }
        if (transition.validator) {
            const isValid = await transition.validator(draft);
            if (!isValid) {
                throw (0, ApiError_1.badRequest)(`Validation failed for ${action}`);
            }
        }
    }
    async createWorkflowEvent(draftId, event, userId, metadata) {
        try {
            await database_1.prisma.event.create({
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
        }
        catch (error) {
            logger_1.logger.error({ error, draftId, event }, 'Failed to create workflow event');
        }
    }
    async notifyCustomer(userId, type, data) {
        try {
            await this.notificationService.send({
                userId,
                type: `draft_${type}`,
                payload: data
            });
        }
        catch (error) {
            logger_1.logger.error({ error, userId, type }, 'Failed to notify customer');
        }
    }
    async notifyDesigner(designerId, type, data) {
        try {
            await this.notificationService.send({
                userId: designerId,
                type: `draft_${type}`,
                payload: data
            });
        }
        catch (error) {
            logger_1.logger.error({ error, designerId, type }, 'Failed to notify designer');
        }
    }
    appendRevisionNotes(currentData, notes) {
        if (!notes)
            return currentData;
        const data = (currentData || {});
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
    appendCancellationReason(currentData, reason) {
        if (!reason)
            return currentData;
        const data = (currentData || {});
        return {
            ...data,
            cancellation: {
                reason,
                canceledAt: new Date().toISOString()
            }
        };
    }
}
exports.DraftWorkflowService = DraftWorkflowService;
