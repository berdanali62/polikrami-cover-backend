// src/modules/drafts/service/draft-validation.service.ts
import { prisma } from '../../../config/database';
import { Draft } from '@prisma/client';
import { badRequest, forbidden } from '../../../shared/errors/ApiError';
import { SetShippingInput } from '../types/draft.type';
import { z } from 'zod';

export class DraftValidationService {
  private readonly VALID_METHODS = ['upload', 'ai', 'artist'];
  private readonly MAX_STEP = 5;
  private readonly MIN_STEP = 1;

  /**
   * Validate draft ownership
   */
  async validateOwnership(draft: Draft, actorId: string): Promise<void> {
    if (draft.userId !== actorId) {
      throw forbidden('You do not have permission to access this draft');
    }
  }

  /**
   * Validate designer permissions
   */
  async validateDesignerAccess(draft: Draft, designerId: string): Promise<void> {
    if (draft.assignedDesignerId !== designerId) {
      throw forbidden('You are not assigned to this draft');
    }
  }

  /**
   * Validate admin or designer access
   */
  async validateDesignerOrAdmin(
    draft: Draft, 
    userId: string, 
    userRole?: string
  ): Promise<void> {
    if (userRole === 'admin') {
      return;
    }
    
    if (draft.assignedDesignerId !== userId) {
      throw forbidden('Access denied');
    }
  }

  /**
   * Validate draft method
   */
  async validateMethod(method: string): Promise<void> {
    if (!this.VALID_METHODS.includes(method)) {
      throw badRequest(
        `Invalid method. Valid values: ${this.VALID_METHODS.join(', ')}`
      );
    }
  }

  /**
   * Validate step progression
   */
  async validateStepProgression(
    currentStep: number, 
    newStep: number
  ): Promise<void> {
    if (newStep < this.MIN_STEP || newStep > this.MAX_STEP) {
      throw badRequest(`Step must be between ${this.MIN_STEP} and ${this.MAX_STEP}`);
    }
    
    // Allow going back or moving forward by 1
    if (Math.abs(newStep - currentStep) > 1 && newStep > currentStep) {
      throw badRequest('Cannot skip steps');
    }
  }

  /**
   * Validate designer exists and has proper role
   */
  async validateDesigner(designerId: string): Promise<void> {
    const designer = await prisma.user.findFirst({
      where: {
        id: designerId,
        roles: {
          some: {
            role: { name: 'designer' }
          }
        }
      },
      select: { id: true }
    });
    
    if (!designer) {
      throw badRequest('Designer not found or does not have designer role');
    }
  }

  /**
   * Validate message card exists
   */
  async validateMessageCard(messageCardId: string): Promise<void> {
    const messageCard = await prisma.messageCard.findUnique({
      where: { id: messageCardId },
      select: { id: true, isPublished: true }
    });
    
    if (!messageCard) {
      throw badRequest('Message card not found');
    }
    
    if (!messageCard.isPublished) {
      throw badRequest('Message card is not published');
    }
  }

  /**
   * Validate shipping information
   */
  async validateShipping(shipping: SetShippingInput): Promise<void> {
    const shippingSchema = z.object({
      senderName: z.string().min(1, 'Sender name is required'),
      senderPhone: z.string().min(5, 'Invalid sender phone'),
      receiverName: z.string().min(1, 'Receiver name is required'),
      receiverPhone: z.string().min(5, 'Invalid receiver phone'),
      city: z.string().min(1, 'City is required'),
      district: z.string().min(1, 'District is required'),
      address: z.string().min(5, 'Address must be at least 5 characters'),
      company: z.string().optional()
    });
    
    try {
      shippingSchema.parse(shipping);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw badRequest('Invalid shipping data', error.errors);
      }
      throw error;
    }
    
    // Additional phone validation
    if (!this.isValidPhoneNumber(shipping.senderPhone)) {
      throw badRequest('Invalid sender phone number format');
    }
    
    if (!this.isValidPhoneNumber(shipping.receiverPhone)) {
      throw badRequest('Invalid receiver phone number format');
    }
  }

  /**
   * Validate file upload parameters
   */
  async validateUploadParams(
    contentType?: string,
    fileSize?: number
  ): Promise<void> {
    const { env } = await import('../../../config/env');
    
    if (contentType && !env.UPLOAD_ALLOWED_MIME.includes(contentType)) {
      throw badRequest(
        `Invalid file type. Allowed types: ${env.UPLOAD_ALLOWED_MIME.join(', ')}`
      );
    }
    
    if (fileSize) {
      const maxSizeBytes = env.UPLOAD_MAX_SIZE_MB * 1024 * 1024;
      
      if (fileSize > maxSizeBytes) {
        throw badRequest(
          `File size exceeds maximum limit of ${env.UPLOAD_MAX_SIZE_MB}MB`
        );
      }
    }
  }

  /**
   * Validate draft can be modified
   */
  async validateCanModify(draft: Draft): Promise<void> {
    if (draft.committedAt) {
      throw badRequest('Cannot modify a committed draft');
    }
    
    const terminalStates = ['COMPLETED', 'CANCELED'];
    if (terminalStates.includes(draft.workflowStatus)) {
      throw badRequest('Cannot modify draft in terminal state');
    }
  }

  /**
   * Validate draft data integrity
   */
  async validateDataIntegrity(draft: Draft): Promise<void> {
    // Check for required fields based on method
    if (draft.method === 'artist' && !draft.assignedDesignerId) {
      throw badRequest('Artist method requires an assigned designer');
    }
    
    if (draft.method === 'ai') {
      const data = draft.data as any;
      if (!data?.aiPromptOriginal) {
        throw badRequest('AI method requires a prompt');
      }
    }
    
    // Validate step consistency
    if (draft.step < 1 || draft.step > 5) {
      throw badRequest('Invalid step value');
    }
  }

  // Helper methods

  private isValidPhoneNumber(phone: string): boolean {
    // Turkish phone number validation (simplified)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check for Turkish mobile (5xxxxxxxxx) or landline formats
    if (cleanPhone.startsWith('0')) {
      return cleanPhone.length === 11;
    }
    
    if (cleanPhone.startsWith('90')) {
      return cleanPhone.length === 12;
    }
    
    if (cleanPhone.startsWith('5')) {
      return cleanPhone.length === 10;
    }
    
    // Allow international formats
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }
}