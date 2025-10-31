import { PrismaClient } from '@prisma/client';
export interface PaymentValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class PaymentValidator {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Validate payment initiation request
     */
    validatePaymentInitiation(params: {
        orderId: string;
        amountCents: number;
        currency: string;
        paymentMethod: string;
        userId: string;
    }): Promise<PaymentValidationResult>;
    /**
     * Validate payment callback
     */
    validatePaymentCallback(params: {
        paymentId: string;
        status: string;
        amountCents?: number;
        signature?: string;
    }): Promise<PaymentValidationResult>;
    /**
     * Validate refund request
     */
    validateRefund(params: {
        paymentId: string;
        amountCents: number;
        reason: string;
        requestedBy: string;
    }): Promise<PaymentValidationResult>;
    /**
     * Validate payment method specific data
     */
    validatePaymentMethodData(method: string, data: any): PaymentValidationResult;
    private validateCardNumber;
    private validateExpiryDate;
    private validateCVV;
    private luhnCheck;
    private validateSignature;
}
