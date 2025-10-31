export interface PaymentProvider {
    name: string;
    initiatePayment(params: InitiatePaymentParams): Promise<PaymentResponse>;
    processCallback(params: CallbackParams): Promise<CallbackResponse>;
    refundPayment(params: RefundParams): Promise<RefundResponse>;
}
export interface InitiatePaymentParams {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    returnUrl?: string;
    cancelUrl?: string;
    paymentMethod: string;
    cardDetails?: any;
    billingAddress?: any;
    installments?: number;
}
export interface PaymentResponse {
    paymentId: string;
    redirectUrl?: string;
    status: 'pending' | 'success' | 'failed';
    providerResponse: any;
}
export interface CallbackParams {
    orderId: string;
    paymentId: string;
    providerData: any;
}
export interface CallbackResponse {
    status: 'success' | 'failed' | 'cancelled';
    transactionId?: string;
    errorMessage?: string;
}
export interface RefundParams {
    paymentId: string;
    amount?: number;
    reason: string;
}
export interface RefundResponse {
    refundId: string;
    status: 'success' | 'failed';
    errorMessage?: string;
}
export declare class PaymentService {
    private providers;
    constructor();
    private getProvider;
    initiatePayment(params: {
        orderId: string;
        paymentMethod: string;
        returnUrl?: string;
        cancelUrl?: string;
        cardDetails?: any;
        billingAddress?: any;
        installments?: number;
    }): Promise<{
        paymentId: string;
        redirectUrl: string | undefined;
        status: "success" | "pending" | "failed";
    }>;
    processCallback(params: {
        orderId: string;
        paymentId: string;
        providerData: any;
    }): Promise<{
        processed: boolean;
        status: "success" | "failed" | "cancelled";
        transactionId?: string;
        errorMessage?: string;
    }>;
    refundPayment(params: {
        paymentId: string;
        amount?: number;
        reason: string;
        userId: string;
    }): Promise<{
        refundId: string;
        status: "success" | "failed";
        amount: number;
    }>;
    getPaymentStatus(paymentId: string, userId: string): Promise<{
        id: string;
        orderId: string;
        status: string;
        amount: number;
        provider: string;
        createdAt: Date;
        receiptUrl: string | null;
    }>;
}
