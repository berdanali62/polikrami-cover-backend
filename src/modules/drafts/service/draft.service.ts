import { prisma } from '../../../config/database';
import { Prisma, Draft, WorkflowStatus } from '@prisma/client';
import { 
  DraftRepository 
} from '../repository/draft.repository';
import { 
  DraftWorkflowService 
} from './draft-workflow.service';
import { 
  DraftUploadService 
} from './draft-upload.service';
import { 
  DraftValidationService 
} from './draft-validation.service';
import { 
  CreateDraftInput, 
  UpdateDraftInput, 
  SetMessageCardInput, 
  SetShippingInput,
  DraftWithRelations 
} from '../types/draft.type';
import { notFound, badRequest } from '../../../shared/errors/ApiError';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export class DraftService {
  constructor(
    private readonly repository = new DraftRepository(),
    private readonly workflowService = new DraftWorkflowService(),
    private readonly uploadService = new DraftUploadService(),
    private readonly validationService = new DraftValidationService()
  ) {}

  /**
   * Create a new draft
   */
  async create(userId: string, input: CreateDraftInput): Promise<Draft> {
    await this.validationService.validateMethod(input.method);
    return this.repository.create({ userId, ...input } as Prisma.DraftUncheckedCreateInput);
  }

  /**
   * List user's drafts with pagination
   */
  async list(
    userId: string, 
    options?: { 
      page?: number; 
      limit?: number; 
      includeRelations?: boolean 
    }
  ) {
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
  async get(id: string, actorId?: string): Promise<DraftWithRelations> {
    const draft = await this.repository.findById(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }
    
    return draft;
  }

  /**
   * Update draft with validation
   */
  async update(
    id: string, 
    input: UpdateDraftInput, 
    actorId?: string
  ): Promise<Draft> {
    const draft = await this.repository.findById(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }
    
    // Validate step progression if provided
    if (input.step !== undefined) {
      await this.validationService.validateStepProgression(
        draft.step, 
        input.step
      );
    }
    
    // Map UpdateDraftInput to Prisma.DraftUpdateInput
    const updateData: Prisma.DraftUpdateInput = {};
    if (input.step !== undefined) updateData.step = input.step;
    if (input.data !== undefined) updateData.data = input.data as unknown as Prisma.InputJsonValue;
    if (input.messageCardId) {
      updateData.messageCard = { connect: { id: input.messageCardId } };
    }
    return this.repository.update(id, updateData);
  }

  /**
   * Assign designer to draft
   */
  async assignDesigner(
    id: string, 
    designerId: string, 
    actorId?: string
  ): Promise<Draft> {
    const draft = await this.repository.findById(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }
    
    // Validate designer exists and has proper role
    await this.validationService.validateDesigner(designerId);
    
    // Check if draft can be assigned (not already completed/cancelled)
    if (!this.workflowService.canAssignDesigner(draft.workflowStatus)) {
      throw badRequest('Cannot assign designer in current workflow state');
    }
    
    const updateData: Prisma.DraftUpdateInput = {
      assignedDesigner: { connect: { id: designerId } }
    };
    
    // Auto-transition to IN_PROGRESS if PENDING
    if (draft.workflowStatus === WorkflowStatus.PENDING) {
      updateData.workflowStatus = WorkflowStatus.IN_PROGRESS;
    }
    
    const updatedDraft = await this.repository.update(id, updateData);
    
    // Send notification to designer
    await this.notifyDesigner(designerId, id);
    
    return updatedDraft;
  }

  /**
   * Set message card for draft
   */
  async setMessageCard(
    id: string, 
    input: SetMessageCardInput, 
    actorId?: string
  ): Promise<Draft> {
    const draft = await this.repository.findById(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }
    
    // Validate message card exists
    await this.validationService.validateMessageCard(input.messageCardId);
    
    const updateData: Prisma.DraftUpdateInput = {
      messageCard: { connect: { id: input.messageCardId } }
    };
    
    // Store additional message card data if provided
    if (input.to || input.signature || input.content) {
      const currentData = (draft.data as any) || {};
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
  async setShipping(
    id: string, 
    input: SetShippingInput, 
    actorId?: string
  ): Promise<Draft> {
    const draft = await this.repository.findById(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }
    
    // Validate shipping data
    await this.validationService.validateShipping(input);
    
    return this.repository.update(id, { 
      shipping: input as unknown as Prisma.InputJsonValue 
    });
  }

  /**
   * Set shipping information from a saved Address record (snapshot only)
   * Does NOT persist anything to Address table; copies fields into draft.shipping
   */
  async setShippingFromAddressId(
    id: string,
    addressId: string,
    actorId?: string
  ): Promise<Draft> {
    const draft = await this.repository.findById(id);
    if (!draft) throw notFound('Draft not found');
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: draft.userId }
    });
    if (!address) {
      throw notFound('Adres bulunamadı veya size ait değil.');
    }

    const receiverName = address.fullName || '';
    const receiverPhone = address.phone || '';
    const city = address.city;
    const district = address.districtName || ''; // Changed from address.district to address.districtName (schema field)
    const addressText = [address.line1, address.line2].filter(Boolean).join(' ');

    const snapshot: SetShippingInput = {
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
      shipping: snapshot as unknown as Prisma.InputJsonValue,
    });
  }

  /**
   * Set ephemeral billing address for checkout. If sameAsShipping=true,
   * derive billing from current draft.shipping. Stored under draft.data.billing.
   */
  async setBillingAddress(
    id: string,
    input: { sameAsShipping?: boolean; billing?: Record<string, unknown> },
    actorId?: string
  ): Promise<Draft> {
    const draft = await this.repository.findById(id);
    if (!draft) throw notFound('Draft not found');
    if (actorId) {
      await this.validationService.validateOwnership(draft, actorId);
    }

    let billing: Record<string, unknown> | undefined = input.billing;
    if (input.sameAsShipping) {
      const sh: any = draft.shipping || {};
      const fullName: string = String(sh.receiverName || sh.senderName || '').trim();
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

    const current = (draft.data as any) || {};
    const updateData: Prisma.DraftUpdateInput = {
      data: {
        ...current,
        billing,
      } as unknown as Prisma.InputJsonValue,
    };

    return this.repository.update(id, updateData);
  }

  /**
   * Commit draft to order
   */
  async commit(id: string, userId: string) {
    const draft = await this.repository.findWithRelations(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    await this.validationService.validateOwnership(draft, userId);
    
    // Validate draft is ready to commit
    if (!this.canCommit(draft)) {
      throw badRequest('Draft is not ready to commit');
    }
    
    // Calculate total price
    const totalCents = this.calculateTotalPrice(draft);
    
    // Create order in transaction with proper isolation
    const { TransactionManager, TransactionConfig } = await import('../../../config/transaction');
    const transactionManager = new TransactionManager(prisma);
    
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
        const billing = ((draft.data as any) || {}).billing;
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random()*9000+1000)}`;
        await tx.invoice.create({
          data: {
            orderId: createdOrder.id,
            userId,
            number: invoiceNumber,
            amountCents: totalCents,
            currency: 'TRY',
            data: billing ? (billing as unknown as Prisma.InputJsonValue) : undefined,
          }
        });
      } catch {
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
  async getUploadUrl(id: string, contentType?: string) {
    const draft = await this.repository.findById(id);
    
    if (!draft) {
      throw notFound('Draft not found');
    }
    
    return this.uploadService.createUploadUrl(id, contentType);
  }

  // Private helper methods
  
  private canCommit(draft: DraftWithRelations): boolean {
    // Check if already committed
    if (draft.committedAt) return false;
    
    // Check required fields with clear error messages
    const missingFields: string[] = [];
    if (!draft.messageCardId) missingFields.push('message card');
    if (!draft.shipping) missingFields.push('shipping information');
    
    if (missingFields.length > 0) {
      throw badRequest(
        `Cannot commit draft. Missing required fields: ${missingFields.join(', ')}`
      );
    }
    
    // Check workflow status if artist method
    if (draft.method === 'artist') {
      return draft.workflowStatus === WorkflowStatus.COMPLETED;
    }
    
    return true;
  }
  
  private calculateTotalPrice(draft: DraftWithRelations): number {
    const cardPrice = draft.messageCard?.priceCents || 0;
    const shippingCost = env.SHIPPING_COST_CENTS;
    return cardPrice + shippingCost;
  }
  
  private async notifyDesigner(designerId: string, draftId: string) {
    try {
      const designer = await prisma.user.findUnique({
        where: { id: designerId },
        select: { email: true, name: true }
      });
      
      if (designer?.email) {
        const { sendEmail } = await import('../../../shared/email/mailer');
        await sendEmail({
          to: designer.email,
          subject: 'Yeni Tasarım İşi Atandı',
          text: `Merhaba ${designer.name || 'Tasarımcı'},\n\nSize yeni bir tasarım işi atandı.\nDraft ID: ${draftId}\n\nİyi çalışmalar!`
        });
      }
    } catch (error) {
      logger.error({ error, designerId, draftId }, 'Failed to notify designer');
    }
  }
  
  private async handlePostCommit(draft: any, order: any) {
    // Auto-create shipment if shipping data is complete
    try {
      const shipping = draft.shipping as any;
      if (shipping?.carrierCode && shipping?.trackingNumber) {
        const { ShipmentService } = await import('../../shipments/service/ShipmentService');
        const shipmentService = new ShipmentService();
        await shipmentService.createAndRegisterShipment({
          orderId: order.id,
          carrierCode: shipping.carrierCode,
          carrierName: shipping.carrierName,
          trackingNumber: shipping.trackingNumber
        });
      }
    } catch (error) {
      logger.error({ error, draftId: draft.id }, 'Auto-shipment creation failed');
    }
    
    // Notify assigned designer about order
    if (draft.assignedDesignerId) {
      await this.notifyDesigner(draft.assignedDesignerId, draft.id);
    }
  }
}