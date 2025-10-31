import { Request, Response } from 'express';
/**
 * Get all shipments for an order
 * GET /api/v1/shipments/orders/:id/shipments
 */
export declare function getOrderShipmentsController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get shipment events (tracking history)
 * GET /api/v1/shipments/:id/events
 */
export declare function getShipmentEventsController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Public tracking endpoint
 * GET /api/v1/shipments/public/:id/events
 */
export declare function getShipmentEventsPublicController(req: Request, res: Response): Promise<void>;
/**
 * Create new shipment (admin only)
 * POST /api/v1/shipments/orders/:id/shipments
 */
export declare function createShipmentController(req: Request, res: Response): Promise<void>;
/**
 * Sync shipment with provider (admin only)
 * POST /api/v1/shipments/:id/sync
 */
export declare function syncShipmentController(req: Request, res: Response): Promise<void>;
/**
 * Webhook endpoint for shipping providers
 * POST /api/v1/shipments/webhook/:provider
 */
export declare function webhookController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get supported carriers list
 * GET /api/v1/shipments/carriers
 */
export declare function listCarriersController(_req: Request, res: Response): Promise<void>;
