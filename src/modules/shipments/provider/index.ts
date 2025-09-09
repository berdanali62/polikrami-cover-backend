import type { Request } from 'express';
import { env } from '../../../config/env';

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
  registerTracking(params: { carrierCode: string; trackingNumber: string; orderId?: string }): Promise<{ externalId?: string } | void>;
  fetchCurrentStatus(ref: TrackingRef): Promise<ShipmentStatusSnapshot | void>;
  fetchEvents(ref: TrackingRef): Promise<NormalizedEvent[]>;
  verifyWebhookSignature(req: Request): Promise<boolean>;
  parseWebhookPayload(req: Request): Promise<{ trackingRef: TrackingRef; status?: string; events?: NormalizedEvent[] } | null>;
}

export function getShipmentProvider(name: string = env.SHIPMENT_PROVIDER): ShipmentProvider {
  if (name === 'mock') {
    const { MockShipmentProvider } = require('./mock.provider');
    return new MockShipmentProvider();
  }
  throw new Error(`Unknown shipment provider: ${name}`);
}


