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
exports.DraftValidationService = void 0;
// src/modules/drafts/service/draft-validation.service.ts
const database_1 = require("../../../config/database");
const ApiError_1 = require("../../../shared/errors/ApiError");
const zod_1 = require("zod");
class DraftValidationService {
    VALID_METHODS = ['upload', 'ai', 'artist'];
    MAX_STEP = 5;
    MIN_STEP = 1;
    /**
     * Validate draft ownership
     */
    async validateOwnership(draft, actorId) {
        if (draft.userId !== actorId) {
            throw (0, ApiError_1.forbidden)('You do not have permission to access this draft');
        }
    }
    /**
     * Validate designer permissions
     */
    async validateDesignerAccess(draft, designerId) {
        if (draft.assignedDesignerId !== designerId) {
            throw (0, ApiError_1.forbidden)('You are not assigned to this draft');
        }
    }
    /**
     * Validate admin or designer access
     */
    async validateDesignerOrAdmin(draft, userId, userRole) {
        if (userRole === 'admin') {
            return;
        }
        if (draft.assignedDesignerId !== userId) {
            throw (0, ApiError_1.forbidden)('Access denied');
        }
    }
    /**
     * Validate draft method
     */
    async validateMethod(method) {
        if (!this.VALID_METHODS.includes(method)) {
            throw (0, ApiError_1.badRequest)(`Invalid method. Valid values: ${this.VALID_METHODS.join(', ')}`);
        }
    }
    /**
     * Validate step progression
     */
    async validateStepProgression(currentStep, newStep) {
        if (newStep < this.MIN_STEP || newStep > this.MAX_STEP) {
            throw (0, ApiError_1.badRequest)(`Step must be between ${this.MIN_STEP} and ${this.MAX_STEP}`);
        }
        // Allow going back or moving forward by 1
        if (Math.abs(newStep - currentStep) > 1 && newStep > currentStep) {
            throw (0, ApiError_1.badRequest)('Cannot skip steps');
        }
    }
    /**
     * Validate designer exists and has proper role
     */
    async validateDesigner(designerId) {
        const designer = await database_1.prisma.user.findFirst({
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
            throw (0, ApiError_1.badRequest)('Designer not found or does not have designer role');
        }
    }
    /**
     * Validate message card exists
     */
    async validateMessageCard(messageCardId) {
        const messageCard = await database_1.prisma.messageCard.findUnique({
            where: { id: messageCardId },
            select: { id: true, isPublished: true }
        });
        if (!messageCard) {
            throw (0, ApiError_1.badRequest)('Message card not found');
        }
        if (!messageCard.isPublished) {
            throw (0, ApiError_1.badRequest)('Message card is not published');
        }
    }
    /**
     * Validate shipping information
     */
    async validateShipping(shipping) {
        const shippingSchema = zod_1.z.object({
            senderName: zod_1.z.string().min(1, 'Sender name is required'),
            senderPhone: zod_1.z.string().min(5, 'Invalid sender phone'),
            receiverName: zod_1.z.string().min(1, 'Receiver name is required'),
            receiverPhone: zod_1.z.string().min(5, 'Invalid receiver phone'),
            city: zod_1.z.string().min(1, 'City is required'),
            district: zod_1.z.string().min(1, 'District is required'),
            address: zod_1.z.string().min(5, 'Address must be at least 5 characters'),
            company: zod_1.z.string().optional()
        });
        try {
            shippingSchema.parse(shipping);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw (0, ApiError_1.badRequest)('Invalid shipping data', error.errors);
            }
            throw error;
        }
        // Additional phone validation
        if (!this.isValidPhoneNumber(shipping.senderPhone)) {
            throw (0, ApiError_1.badRequest)('Invalid sender phone number format');
        }
        if (!this.isValidPhoneNumber(shipping.receiverPhone)) {
            throw (0, ApiError_1.badRequest)('Invalid receiver phone number format');
        }
    }
    /**
     * Validate file upload parameters
     */
    async validateUploadParams(contentType, fileSize) {
        const { env } = await Promise.resolve().then(() => __importStar(require('../../../config/env')));
        if (contentType && !env.UPLOAD_ALLOWED_MIME.includes(contentType)) {
            throw (0, ApiError_1.badRequest)(`Invalid file type. Allowed types: ${env.UPLOAD_ALLOWED_MIME.join(', ')}`);
        }
        if (fileSize) {
            const maxSizeBytes = env.UPLOAD_MAX_SIZE_MB * 1024 * 1024;
            if (fileSize > maxSizeBytes) {
                throw (0, ApiError_1.badRequest)(`File size exceeds maximum limit of ${env.UPLOAD_MAX_SIZE_MB}MB`);
            }
        }
    }
    /**
     * Validate draft can be modified
     */
    async validateCanModify(draft) {
        if (draft.committedAt) {
            throw (0, ApiError_1.badRequest)('Cannot modify a committed draft');
        }
        const terminalStates = ['COMPLETED', 'CANCELED'];
        if (terminalStates.includes(draft.workflowStatus)) {
            throw (0, ApiError_1.badRequest)('Cannot modify draft in terminal state');
        }
    }
    /**
     * Validate draft data integrity
     */
    async validateDataIntegrity(draft) {
        // Check for required fields based on method
        if (draft.method === 'artist' && !draft.assignedDesignerId) {
            throw (0, ApiError_1.badRequest)('Artist method requires an assigned designer');
        }
        if (draft.method === 'ai') {
            const data = draft.data;
            if (!data?.aiPromptOriginal) {
                throw (0, ApiError_1.badRequest)('AI method requires a prompt');
            }
        }
        // Validate step consistency
        if (draft.step < 1 || draft.step > 5) {
            throw (0, ApiError_1.badRequest)('Invalid step value');
        }
    }
    // Helper methods
    isValidPhoneNumber(phone) {
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
exports.DraftValidationService = DraftValidationService;
