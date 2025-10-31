import { z } from 'zod';
export declare const initiatePaymentSchema: z.ZodObject<{
    orderId: z.ZodString;
    paymentMethod: z.ZodEnum<["credit_card", "bank_transfer", "digital_wallet"]>;
    returnUrl: z.ZodOptional<z.ZodString>;
    cancelUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    paymentMethod: "credit_card" | "bank_transfer" | "digital_wallet";
    returnUrl?: string | undefined;
    cancelUrl?: string | undefined;
}, {
    orderId: string;
    paymentMethod: "credit_card" | "bank_transfer" | "digital_wallet";
    returnUrl?: string | undefined;
    cancelUrl?: string | undefined;
}>;
export declare const creditCardPaymentSchema: z.ZodObject<{
    orderId: z.ZodString;
    cardDetails: z.ZodObject<{
        cardNumber: z.ZodString;
        expiryMonth: z.ZodString;
        expiryYear: z.ZodString;
        cvv: z.ZodString;
        cardHolderName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
        cardHolderName: string;
    }, {
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
        cardHolderName: string;
    }>;
    billingAddress: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        address: z.ZodString;
        city: z.ZodString;
        country: z.ZodString;
        zipCode: z.ZodString;
        phone: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone: string;
        city: string;
        country: string;
        address: string;
        firstName: string;
        lastName: string;
        zipCode: string;
    }, {
        email: string;
        phone: string;
        city: string;
        country: string;
        address: string;
        firstName: string;
        lastName: string;
        zipCode: string;
    }>;
    installments: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    cardDetails: {
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
        cardHolderName: string;
    };
    billingAddress: {
        email: string;
        phone: string;
        city: string;
        country: string;
        address: string;
        firstName: string;
        lastName: string;
        zipCode: string;
    };
    installments: number;
}, {
    orderId: string;
    cardDetails: {
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
        cardHolderName: string;
    };
    billingAddress: {
        email: string;
        phone: string;
        city: string;
        country: string;
        address: string;
        firstName: string;
        lastName: string;
        zipCode: string;
    };
    installments?: number | undefined;
}>;
export declare const paymentCallbackSchema: z.ZodObject<{
    orderId: z.ZodString;
    paymentId: z.ZodString;
    status: z.ZodEnum<["success", "failed", "cancelled"]>;
    transactionId: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "failed" | "success" | "cancelled";
    currency: string;
    orderId: string;
    paymentId: string;
    transactionId?: string | undefined;
    errorMessage?: string | undefined;
    amount?: number | undefined;
}, {
    status: "failed" | "success" | "cancelled";
    orderId: string;
    paymentId: string;
    currency?: string | undefined;
    transactionId?: string | undefined;
    errorMessage?: string | undefined;
    amount?: number | undefined;
}>;
export declare const refundPaymentSchema: z.ZodObject<{
    paymentId: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    paymentId: string;
    amount?: number | undefined;
}, {
    reason: string;
    paymentId: string;
    amount?: number | undefined;
}>;
export type InitiatePaymentDto = z.infer<typeof initiatePaymentSchema>;
export type CreditCardPaymentDto = z.infer<typeof creditCardPaymentSchema>;
export type PaymentCallbackDto = z.infer<typeof paymentCallbackSchema>;
export type RefundPaymentDto = z.infer<typeof refundPaymentSchema>;
