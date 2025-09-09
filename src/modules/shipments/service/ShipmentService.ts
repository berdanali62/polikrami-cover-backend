import { prisma } from '../../../config/database';
import { notFound, forbidden } from '../../../shared/errors/ApiError';
import { Prisma, ShipmentStatus } from '@prisma/client';
import { env } from '../../../config/env';
import type { Request } from 'express';
import { getShipmentProvider } from '../provider';

export class ShipmentService {
  async getOrderShipments(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
    if (!order) throw notFound('Order not found');
    if (order.userId !== userId) throw forbidden();
    const shipments = await prisma.shipment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
    return shipments;
  }

  async getShipmentEvents(userId: string, shipmentId: string) {
    const shp = await prisma.shipment.findUnique({ where: { id: shipmentId }, include: { order: { select: { userId: true } } } });
    if (!shp) throw notFound('Shipment not found');
    if (shp.order.userId !== userId) throw forbidden();
    const events = await prisma.shipmentEvent.findMany({ where: { shipmentId }, orderBy: { occurredAt: 'desc' } });
    return { shipment: { id: shp.id, status: shp.status, carrierCode: shp.carrierCode, trackingNumber: shp.trackingNumber }, events };
  }

  async createAndRegisterShipment(params: { orderId: string; carrierCode: string; carrierName?: string; trackingNumber: string }) {
    // Validate carrier against env list
    const allowed = new Set((env.SHIPMENT_CARRIERS as { code: string; name: string }[]).map((c) => c.code));
    if (!allowed.has(params.carrierCode)) {
      const fallback = env.SHIPMENT_DEFAULT_CARRIER || 'mock';
      params = { ...params, carrierCode: fallback };
    }
    const order = await prisma.order.findUnique({ where: { id: params.orderId } });
    if (!order) throw notFound('Order not found');
    const provider = getShipmentProvider();
    const created = await prisma.shipment.create({ data: { orderId: params.orderId, carrierCode: params.carrierCode, carrierName: params.carrierName, trackingNumber: params.trackingNumber, status: ShipmentStatus.created } });
    try {
      const reg = await provider.registerTracking({ carrierCode: created.carrierCode, trackingNumber: created.trackingNumber, orderId: created.orderId });
      if (reg?.externalId) {
        await prisma.shipment.update({ where: { id: created.id }, data: { externalId: reg.externalId } });
      }
    } catch {}
    return created;
  }

  async syncShipment(shipmentId: string) {
    const shp = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shp) throw notFound('Shipment not found');
    const provider = getShipmentProvider();
    const ref = { carrierCode: shp.carrierCode, trackingNumber: shp.trackingNumber, externalId: shp.externalId };
    const status = await provider.fetchCurrentStatus(ref);
    const events = await provider.fetchEvents(ref);

    await prisma.$transaction(async (tx) => {
      if (status?.status) {
        await tx.shipment.update({ where: { id: shp.id }, data: { status: (status.status as any) || shp.status, estimatedDeliveryAt: status.estimatedDeliveryAt || shp.estimatedDeliveryAt, lastSyncAt: new Date() } });
      }
      if (Array.isArray(events)) {
        for (const e of events) {
          try {
            await tx.shipmentEvent.create({ data: { shipmentId: shp.id, occurredAt: e.occurredAt, status: e.status, description: e.description, location: e.location, raw: (e.raw as unknown as Prisma.InputJsonValue), providerEventId: e.providerEventId } });
          } catch {}
        }
      }
    });

    return { ok: true } as const;
  }

  async handleWebhook(providerName: string, req: Request): Promise<boolean> {
    const provider = getShipmentProvider(providerName);
    if (!(await provider.verifyWebhookSignature(req))) return false;
    const payload = await provider.parseWebhookPayload(req);
    if (!payload) return false;

    // Resolve shipment record by external reference or tracking composite
    const shp = await prisma.shipment.findFirst({
      where: {
        OR: [
          { externalId: payload.trackingRef.externalId || '' },
          { carrierCode: payload.trackingRef.carrierCode, trackingNumber: payload.trackingRef.trackingNumber },
        ],
      },
    });
    if (!shp) return false;

    await prisma.$transaction(async (tx) => {
      if (payload.status) {
        await tx.shipment.update({ where: { id: shp.id }, data: { status: (payload.status as any), lastSyncAt: new Date() } });
      }
      for (const e of payload.events || []) {
        try {
          await tx.shipmentEvent.create({ data: { shipmentId: shp.id, occurredAt: e.occurredAt, status: e.status, description: e.description, location: e.location, raw: (e.raw as unknown as Prisma.InputJsonValue), providerEventId: e.providerEventId } });
        } catch {}
      }
    });
    return true;
  }
}


