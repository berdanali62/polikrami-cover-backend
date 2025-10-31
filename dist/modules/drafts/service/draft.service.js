"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftService = void 0;
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
const draft_repository_1 = require("../repository/draft.repository");
const draft_workflow_service_1 = require("./draft-workflow.service");
const draft_upload_service_1 = require("./draft-upload.service");
const draft_validation_service_1 = require("./draft-validation.service");
const ApiError_1 = require("../../../shared/errors/ApiError");
const env_1 = require("../../../config/env");
const logger_1 = require("../../../utils/logger");
class DraftService {
    repository;
    workflowService;
    uploadService;
    validationService;
    constructor(repository = new draft_repository_1.DraftRepository(), workflowService = new draft_workflow_service_1.DraftWorkflowService(), uploadService = new draft_upload_service_1.DraftUploadService(), validationService = new draft_validation_service_1.DraftValidationService()) {
        this.repository = repository;
        this.workflowService = workflowService;
        this.uploadService = uploadService;
        this.validationService = validationService;
    }
    /**
     * Create a new draft
     */
    async create(userId, input) {
        await this.validationService.validateMethod(input.method);
        return this.repository.create({ userId, ...input });
    }
    /**
     * List user's drafts with pagination
     */
    async list(userId, options) {
        const { page = 1, limit = 20, includeRelations = false } = options || {};
        const offset = (page - 1) * limit;
        return this.repository.findMany({
            where: { userId },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: includeRelations ? {
                messageCard: true,
                assignedDesigner: { select: { id: true, name: true, email: true } }
            } : undefined
        });
    }
    /**
     * Get single draft with ownership validation
     */
    async get(id, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        return draft;
    }
    /**
     * Update draft with validation
     */
    async update(id, input, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        // Validate step progression if provided
        if (input.step !== undefined) {
            await this.validationService.validateStepProgression(draft.step, input.step);
        }
        // Map UpdateDraftInput to Prisma.DraftUpdateInput
        const updateData = {};
        if (input.step !== undefined)
            updateData.step = input.step;
        if (input.data !== undefined)
            updateData.data = input.data;
        if (input.messageCardId) {
            updateData.messageCard = { connect: { id: input.messageCardId } };
        }
        return this.repository.update(id, updateData);
    }
    /**
     * Assign designer to draft
     */
    async assignDesigner(id, designerId, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        // Validate designer exists and has proper role
        await this.validationService.validateDesigner(designerId);
        // Check if draft can be assigned (not already completed/cancelled)
        if (!this.workflowService.canAssignDesigner(draft.workflowStatus)) {
            throw (0, ApiError_1.badRequest)('Cannot assign designer in current workflow state');
        }
        const updateData = {
            assignedDesigner: { connect: { id: designerId } }
        };
        // Auto-transition to IN_PROGRESS if PENDING
        if (draft.workflowStatus === client_1.WorkflowStatus.PENDING) {
            updateData.workflowStatus = client_1.WorkflowStatus.IN_PROGRESS;
        }
        const updatedDraft = await this.repository.update(id, updateData);
        // Send notification to designer
        await this.notifyDesigner(designerId, id);
        return updatedDraft;
    }
    /**
     * Set message card for draft
     */
    async setMessageCard(id, input, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        // Validate message card exists
        await this.validationService.validateMessageCard(input.messageCardId);
        const updateData = {
            messageCard: { connect: { id: input.messageCardId } }
        };
        // Store additional message card data if provided
        if (input.to || input.signature || input.content) {
            const currentData = draft.data || {};
            updateData.data = {
                ...currentData,
                messageCard: {
                    to: input.to,
                    signature: input.signature,
                    content: input.content
                }
            };
        }
        return this.repository.update(id, updateData);
    }
    /**
     * Set shipping information
     */
    async setShipping(id, input, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        // Validate shipping data
        await this.validationService.validateShipping(input);
        return this.repository.update(id, {
            shipping: input
        });
    }
    /**
     * Set shipping information from a saved Address record (snapshot only)
     * Does NOT persist anything to Address table; copies fields into draft.shipping
     */
    async setShippingFromAddressId(id, addressId, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft)
            throw (0, ApiError_1.notFound)('Draft not found');
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        const address = await database_1.prisma.address.findFirst({
            where: { id: addressId, userId: draft.userId }
        });
        if (!address) {
            throw (0, ApiError_1.notFound)('Adres bulunamadı veya size ait değil.');
        }
        const receiverName = address.fullName || '';
        const receiverPhone = address.phone || '';
        const city = address.city;
        const district = address.districtName || ''; // Changed from address.district to address.districtName (schema field)
        const addressText = [address.line1, address.line2].filter(Boolean).join(' ');
        const snapshot = {
            senderName: receiverName,
            senderPhone: receiverPhone,
            receiverName,
            receiverPhone,
            city,
            district,
            address: addressText,
            company: undefined,
        };
        return this.repository.update(id, {
            shipping: snapshot,
        });
    }
    /**
     * Set ephemeral billing address for checkout. If sameAsShipping=true,
     * derive billing from current draft.shipping. Stored under draft.data.billing.
     */
    async setBillingAddress(id, input, actorId) {
        const draft = await this.repository.findById(id);
        if (!draft)
            throw (0, ApiError_1.notFound)('Draft not found');
        if (actorId) {
            await this.validationService.validateOwnership(draft, actorId);
        }
        let billing = input.billing;
        if (input.sameAsShipping) {
            const sh = draft.shipping || {};
            const fullName = String(sh.receiverName || sh.senderName || '').trim();
            const parts = fullName.split(/\s+/);
            const firstName = parts[0] || fullName;
            const lastName = parts.slice(1).join(' ') || '';
            billing = {
                type: 'personal',
                firstName,
                lastName,
                phone: sh.receiverPhone || sh.senderPhone || '',
                city: sh.city,
                district: sh.district,
                address: sh.address,
                country: 'TR',
            };
        }
        const current = draft.data || {};
        const updateData = {
            data: {
                ...current,
                billing,
            },
        };
        return this.repository.update(id, updateData);
    }
    /**
     * Commit draft to order
     */
    async commit(id, userId) {
        const draft = await this.repository.findWithRelations(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        await this.validationService.validateOwnership(draft, userId);
        // Validate draft is ready to commit
        if (!this.canCommit(draft)) {
            throw (0, ApiError_1.badRequest)('Draft is not ready to commit');
        }
        // Calculate total price
        const totalCents = this.calculateTotalPrice(draft);
        // Create order in transaction with proper isolation
        const { TransactionManager, TransactionConfig } = await Promise.resolve().then(() => __importStar(require('../../../config/transaction')));
        const transactionManager = new TransactionManager(database_1.prisma);
        const order = await transactionManager.executeWithIsolation(async (tx) => {
            // Create order
            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    totalCents,
                    currency: 'TRY'
                }
            });
            // Create order item
            await tx.orderItem.create({
                data: {
                    orderId: createdOrder.id,
                    type: 'draft',
                    referenceId: draft.id,
                    unitPriceCents: totalCents,
                    quantity: 1
                }
            });
            // Mark draft as committed
            await tx.draft.update({
                where: { id },
                data: { committedAt: new Date() }
            });
            // Create invoice snapshot (ephemeral billing stored in draft.data.billing)
            try {
                const billing = (draft.data || {}).billing;
                const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
                await tx.invoice.create({
                    data: {
                        orderId: createdOrder.id,
                        userId,
                        number: invoiceNumber,
                        amountCents: totalCents,
                        currency: 'TRY',
                        data: billing ? billing : undefined,
                    }
                });
            }
            catch {
                // tolerate invoice create failure; payment flow may create later
            }
            return createdOrder;
        }, TransactionConfig.DRAFT_COMMIT);
        // Post-commit actions (non-blocking)
        this.handlePostCommit(draft, order);
        return order;
    }
    /**
     * Get presigned upload URL
     */
    async getUploadUrl(id, contentType) {
        const draft = await this.repository.findById(id);
        if (!draft) {
            throw (0, ApiError_1.notFound)('Draft not found');
        }
        return this.uploadService.createUploadUrl(id, contentType);
    }
    // Private helper methods
    canCommit(draft) {
        // Check if already committed
        if (draft.committedAt)
            return false;
        // Check required fields with clear error messages
        const missingFields = [];
        if (!draft.messageCardId)
            missingFields.push('message card');
        if (!draft.shipping)
            missingFields.push('shipping information');
        if (missingFields.length > 0) {
            throw (0, ApiError_1.badRequest)(`Cannot commit draft. Missing required fields: ${missingFields.join(', ')}`);
        }
        // Check workflow status if artist method
        if (draft.method === 'artist') {
            return draft.workflowStatus === client_1.WorkflowStatus.COMPLETED;
        }
        return true;
    }
    calculateTotalPrice(draft) {
        const cardPrice = draft.messageCard?.priceCents || 0;
        const shippingCost = env_1.env.SHIPPING_COST_CENTS;
        return cardPrice + shippingCost;
    }
    async notifyDesigner(designerId, draftId) {
        try {
            const designer = await database_1.prisma.user.findUnique({
                where: { id: designerId },
                select: { email: true, name: true }
            });
            if (designer?.email) {
                const { sendEmail } = await Promise.resolve().then(() => __importStar(require('../../../shared/email/mailer')));
                await sendEmail({
                    to: designer.email,
                    subject: 'Yeni Tasarım İşi Atandı',
                    text: `Merhaba ${designer.name || 'Tasarımcı'},\n\nSize yeni bir tasarım işi atandı.\nDraft ID: ${draftId}\n\nİyi çalışmalar!`
                });
            }
        }
        catch (error) {
            logger_1.logger.error({ error, designerId, draftId }, 'Failed to notify designer');
        }
    }
    async handlePostCommit(draft, order) {
        // Auto-create shipment if shipping data is complete
        try {
            const shipping = draft.shipping;
            if (shipping?.carrierCode && shipping?.trackingNumber) {
                const { ShipmentService } = await Promise.resolve().then(() => __importStar(require('../../shipments/service/ShipmentService')));
                const shipmentService = new ShipmentService();
                await shipmentService.createAndRegisterShipment({
                    orderId: order.id,
                    carrierCode: shipping.carrierCode,
                    carrierName: shipping.carrierName,
                    trackingNumber: shipping.trackingNumber
                });
            }
        }
        catch (error) {
            logger_1.logger.error({ error, draftId: draft.id }, 'Auto-shipment creation failed');
        }
        // Notify assigned designer about order
        if (draft.assignedDesignerId) {
            await this.notifyDesigner(draft.assignedDesignerId, draft.id);
        }
    }
}
exports.DraftService = DraftService;
