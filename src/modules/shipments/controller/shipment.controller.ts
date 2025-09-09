import { Request, Response } from 'express';
import { ShipmentService } from '../service/ShipmentService';
import { env } from '../../../config/env';

const service = new ShipmentService();

export async function getOrderShipmentsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const orderId = req.params.id as string;
  const result = await service.getOrderShipments(userId, orderId);
  res.status(200).json(result);
}

export async function getShipmentEventsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const shipmentId = req.params.id as string;
  const result = await service.getShipmentEvents(userId, shipmentId);
  res.status(200).json(result);
}

export async function createShipmentController(req: Request, res: Response) {
  const orderId = req.params.id as string;
  const { carrierCode, carrierName, trackingNumber } = req.body as { carrierCode: string; carrierName?: string; trackingNumber: string };
  const result = await service.createAndRegisterShipment({ orderId, carrierCode, carrierName, trackingNumber });
  res.status(201).json(result);
}

export async function syncShipmentController(req: Request, res: Response) {
  const shipmentId = req.params.id as string;
  const result = await service.syncShipment(shipmentId);
  res.status(200).json(result);
}

export async function webhookController(req: Request, res: Response) {
  try {
    const providerName = (req.params.provider || env.SHIPMENT_PROVIDER) as string;
    const handled = await service.handleWebhook(providerName, req);
    if (!handled) return res.status(400).json({ message: 'Webhook not handled' });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: 'Invalid webhook' });
  }
}

export async function listCarriersController(_req: Request, res: Response) {
  const list = (env.SHIPMENT_CARRIERS as { code: string; name: string }[]);
  res.status(200).json(list);
}


