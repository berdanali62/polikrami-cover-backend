import { Draft } from '@prisma/client';
import { SetShippingInput } from '../types/draft.type';
export declare class DraftValidationService {
    private readonly VALID_METHODS;
    private readonly MAX_STEP;
    private readonly MIN_STEP;
    /**
     * Validate draft ownership
     */
    validateOwnership(draft: Draft, actorId: string): Promise<void>;
    /**
     * Validate designer permissions
     */
    validateDesignerAccess(draft: Draft, designerId: string): Promise<void>;
    /**
     * Validate admin or designer access
     */
    validateDesignerOrAdmin(draft: Draft, userId: string, userRole?: string): Promise<void>;
    /**
     * Validate draft method
     */
    validateMethod(method: string): Promise<void>;
    /**
     * Validate step progression
     */
    validateStepProgression(currentStep: number, newStep: number): Promise<void>;
    /**
     * Validate designer exists and has proper role
     */
    validateDesigner(designerId: string): Promise<void>;
    /**
     * Validate message card exists
     */
    validateMessageCard(messageCardId: string): Promise<void>;
    /**
     * Validate shipping information
     */
    validateShipping(shipping: SetShippingInput): Promise<void>;
    /**
     * Validate file upload parameters
     */
    validateUploadParams(contentType?: string, fileSize?: number): Promise<void>;
    /**
     * Validate draft can be modified
     */
    validateCanModify(draft: Draft): Promise<void>;
    /**
     * Validate draft data integrity
     */
    validateDataIntegrity(draft: Draft): Promise<void>;
    private isValidPhoneNumber;
}
