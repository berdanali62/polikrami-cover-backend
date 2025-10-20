import { Request, Response } from 'express';
import { ShipmentService } from '../service/ShipmentService';
import { createShipmentSchema } from '../dto/shipment.dto';

const service = new ShipmentService();

/**
 * Get all shipments for an order
 * GET /api/v1/shipments/orders/:id/shipments
 */
export async function getOrderShipmentsController(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const orderId = (req.params as { id?: string }).id || '';

  const shipments = await service.getOrderShipments(userId, orderId);

  res.status(200).json({ shipments });
}

/**
 * Get shipment events (tracking history)
 * GET /api/v1/shipments/:id/events
 */
export async function getShipmentEventsController(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const shipmentId = (req.params as { id?: string }).id || '';

  const result = await service.getShipmentEvents(userId, shipmentId);

  res.status(200).json(result);
}

/**
 * Public tracking endpoint
 * GET /api/v1/shipments/public/:id/events
 */
export async function getShipmentEventsPublicController(req: Request, res: Response) {
  const shipmentId = (req.params as { id?: string }).id || '';
  const verificationToken = (req.query as { token?: string }).token;

  const result = await service.getShipmentEventsPublic(shipmentId, verificationToken);

  res.status(200).json(result);
}

/**
 * Create new shipment (admin only)
 * POST /api/v1/shipments/orders/:id/shipments
 */
export async function createShipmentController(req: Request, res: Response) {
  const orderId = (req.params as { id?: string }).id || '';
  const data = createShipmentSchema.parse(req.body);

  const shipment = await service.createAndRegisterShipment({
    orderId,
    ...data
  });

  res.status(201).json(shipment);
}

/**
 * Sync shipment with provider (admin only)
 * POST /api/v1/shipments/:id/sync
 */
export async function syncShipmentController(req: Request, res: Response) {
  const shipmentId = (req.params as { id?: string }).id || '';

  const result = await service.syncShipment(shipmentId);

  res.status(200).json(result);
}

/**
 * Webhook endpoint for shipping providers
 * POST /api/v1/shipments/webhook/:provider
 */
export async function webhookController(req: Request, res: Response) {
  const providerName = req.params.provider || 'mock';

  const handled = await service.handleWebhook(providerName, req);

  if (!handled) {
    return res.status(400).json({ 
      message: 'Webhook işlenemedi' 
    });
  }

  res.status(200).json({ success: true });
}

/**
 * Get supported carriers list
 * GET /api/v1/shipments/carriers
 */
export async function listCarriersController(_req: Request, res: Response) {
  const carriers = service.getCarriersList();

  res.status(200).json({ carriers });
}