import type { Request } from 'express';
export interface TrackingRef {
    carrierCode: string;
    trackingNumber: string;
    externalId?: string | null;
}
export interface NormalizedEvent {
    occurredAt: Date;
    status: string;
    description?: string;
    location?: string;
    raw?: unknown;
    providerEventId?: string;
}
export interface ShipmentStatusSnapshot {
    status?: string;
    estimatedDeliveryAt?: Date;
}
export interface ShipmentProvider {
    registerTracking(params: {
        carrierCode: string;
        trackingNumber: string;
        orderId?: string;
    }): Promise<{
        externalId?: string;
    } | void>;
    fetchCurrentStatus(ref: TrackingRef): Promise<ShipmentStatusSnapshot | void>;
    fetchEvents(ref: TrackingRef): Promise<NormalizedEvent[]>;
    verifyWebhookSignature(req: Request): Promise<boolean>;
    parseWebhookPayload(req: Request): Promise<{
        trackingRef: TrackingRef;
        status?: string;
        events?: NormalizedEvent[];
    } | null>;
}
export declare function getShipmentProvider(name?: string): ShipmentProvider;
