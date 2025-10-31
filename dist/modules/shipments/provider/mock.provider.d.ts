import type { Request } from 'express';
import { ShipmentProvider, TrackingRef, NormalizedEvent, ShipmentStatusSnapshot } from './index';
export declare class MockShipmentProvider implements ShipmentProvider {
    registerTracking(_params: {
        carrierCode: string;
        trackingNumber: string;
        orderId?: string;
    }): Promise<{
        externalId?: string;
    } | void>;
    fetchCurrentStatus(_ref: TrackingRef): Promise<ShipmentStatusSnapshot | void>;
    fetchEvents(_ref: TrackingRef): Promise<NormalizedEvent[]>;
    verifyWebhookSignature(_req: Request): Promise<boolean>;
    parseWebhookPayload(req: Request): Promise<{
        trackingRef: TrackingRef;
        status?: string;
        events?: NormalizedEvent[];
    } | null>;
}
