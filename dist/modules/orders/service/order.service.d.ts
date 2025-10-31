import { OrderStatus } from '@prisma/client';
export declare class OrderService {
    listMy(userId: string): Promise<({
        items: {
            id: string;
            type: string;
            orderId: string;
            referenceId: string | null;
            quantity: number;
            unitPriceCents: number;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            status: string;
            orderId: string;
            provider: string;
            providerPaymentId: string | null;
            amountCents: number;
            receiptUrl: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalCents: number;
        currency: string;
        cancelReason: string | null;
    })[]>;
    get(userId: string, orderId: string): Promise<{
        items: {
            id: string;
            type: string;
            orderId: string;
            referenceId: string | null;
            quantity: number;
            unitPriceCents: number;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            status: string;
            orderId: string;
            provider: string;
            providerPaymentId: string | null;
            amountCents: number;
            receiptUrl: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalCents: number;
        currency: string;
        cancelReason: string | null;
    }>;
    updateStatusForTesting(orderId: string, status: OrderStatus): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalCents: number;
        currency: string;
        cancelReason: string | null;
    }>;
    cancel(userId: string, orderId: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalCents: number;
        currency: string;
        cancelReason: string | null;
    }>;
}
