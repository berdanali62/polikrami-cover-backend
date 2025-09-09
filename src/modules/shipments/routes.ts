import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateBody, validateParams } from '../../middlewares/validation';
import { z } from 'zod';
import { createShipmentController, getOrderShipmentsController, getShipmentEventsController, syncShipmentController, webhookController, listCarriersController } from './controller/shipment.controller';

const router = Router();

const orderParam = z.object({ id: z.string().uuid() });
const shipmentParam = z.object({ id: z.string().uuid() });

// Wrap async middlewares to satisfy no-misused-promises
const authMw: RequestHandler = (req, res, next) => { void requireAuth(req, res, next); };
const adminMw: RequestHandler = (req, res, next) => { void requireRole('admin')(req, res, next); };

// User endpoints
router.get('/orders/:id/shipments', authMw, validateParams(orderParam), asyncHandler(getOrderShipmentsController));
router.get('/:id/events', authMw, validateParams(shipmentParam), asyncHandler(getShipmentEventsController));

// Admin endpoints
const createSchema = z.object({ carrierCode: z.string().min(2), carrierName: z.string().optional(), trackingNumber: z.string().min(3) });
router.post('/orders/:id/shipments', adminMw, validateParams(orderParam), validateBody(createSchema), asyncHandler(createShipmentController));
router.post('/:id/sync', adminMw, validateParams(shipmentParam), asyncHandler(syncShipmentController));

// Public carriers list (for UI forms)
router.get('/carriers', asyncHandler(listCarriersController));

// Webhook endpoint (public - signature verified inside)
router.post('/webhook/:provider', asyncHandler(webhookController));

export default router;


