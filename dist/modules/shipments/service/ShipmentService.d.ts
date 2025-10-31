import type { Request } from 'express';
export declare class ShipmentService {
    /**
     * Get all shipments for an order (user must own the order)
     */
    getOrderShipments(userId: string, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        carrierCode: string;
        carrierName: string | null;
        trackingNumber: string;
        estimatedDeliveryAt: Date | null;
        lastSyncAt: Date | null;
    }[]>;
    /**
     * Get shipment events (user must own the order)
     */
    getShipmentEvents(userId: string, shipmentId: string): Promise<{
        shipment: {
            id: string;
            status: import(".prisma/client").$Enums.ShipmentStatus;
            carrierCode: string;
            carrierName: string | null;
            trackingNumber: string;
            estimatedDeliveryAt: Date | null;
            orderId: string;
        };
        events: {
            id: string;
            createdAt: Date;
            status: string;
            occurredAt: Date;
            description: string | null;
            location: string | null;
        }[];
    }>;
    /**
     * Public tracking endpoint (with rate limiting)
     * SECURITY: Should require email/phone verification or tracking token
     */
    getShipmentEventsPublic(shipmentId: string, verificationToken?: string): Promise<{
        shipment: {
            id: string;
            status: import(".prisma/client").$Enums.ShipmentStatus;
            carrierCode: string;
            carrierName: string | null;
            trackingNumber: string;
            estimatedDeliveryAt: Date | null;
        };
        events: {
            id: string;
            status: string;
            occurredAt: Date;
            description: string | null;
            location: string | null;
        }[];
    }>;
    /**
     * Create and register shipment with carrier
     * Admin only
     */
    createAndRegisterShipment(params: {
        orderId: string;
        carrierCode: string;
        carrierName?: string;
        trackingNumber: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        carrierCode: string;
        carrierName: string | null;
        trackingNumber: string;
        trackingToken: string | null;
        externalId: string | null;
        estimatedDeliveryAt: Date | null;
        lastSyncAt: Date | null;
        orderId: string;
    }>;
    /**
     * Register shipment with external provider
     */
    private registerWithProvider;
    /**
     * Sync shipment status from provider
     * Admin only
     */
    syncShipment(shipmentId: string): Promise<{
        success: boolean;
        syncedAt: Date;
    }>;
    /**
     * Handle webhook from shipping provider
     */
    handleWebhook(providerName: string, req: Request): Promise<boolean>;
    /**
     * Get list of supported carriers
     */
    getCarriersList(): {
        code: string;
        name: string;
    }[];
    /**
     * Verify tracking token (placeholder for future implementation)
     */
    private verifyTrackingToken;
    /**
     * Notify user about shipment update
     */
    private notifyUserAboutUpdate;
}
