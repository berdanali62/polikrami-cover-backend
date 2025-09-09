import type { Request } from 'express';
import { ShipmentProvider, TrackingRef, NormalizedEvent, ShipmentStatusSnapshot } from './index';
import crypto from 'crypto';

export class MockShipmentProvider implements ShipmentProvider {
  async registerTracking(_params: { carrierCode: string; trackingNumber: string; orderId?: string }): Promise<{ externalId?: string } | void> {
    return { externalId: crypto.randomUUID() };
  }

  async fetchCurrentStatus(_ref: TrackingRef): Promise<ShipmentStatusSnapshot | void> {
    return { status: 'in_transit' };
  }

  async fetchEvents(_ref: TrackingRef): Promise<NormalizedEvent[]> {
    const now = new Date();
    return [
      { occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), status: 'label_created', description: 'Label created' },
      { occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 12), status: 'in_transit', description: 'Departed facility' },
    ];
  }

  async verifyWebhookSignature(_req: Request): Promise<boolean> {
    // Always true for mock
    return true;
  }

  async parseWebhookPayload(req: Request): Promise<{ trackingRef: TrackingRef; status?: string; events?: NormalizedEvent[] } | null> {
    const body = req.body as any;
    if (!body || !body.trackingNumber || !body.carrierCode) return null;
    const events: NormalizedEvent[] = Array.isArray(body.events)
      ? body.events.map((e: any) => ({
          occurredAt: new Date(e.occurredAt || Date.now()),
          status: String(e.status || 'in_transit'),
          description: e.description,
          location: e.location,
          raw: e,
          providerEventId: e.id,
        }))
      : [];
    return {
      trackingRef: { carrierCode: body.carrierCode, trackingNumber: body.trackingNumber, externalId: body.externalId },
      status: body.status,
      events,
    };
  }
}


