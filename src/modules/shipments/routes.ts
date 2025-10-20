import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateBody, validateParams } from '../../middlewares/validation';
import {
  createShipmentController,
  getOrderShipmentsController,
  getShipmentEventsController,
  syncShipmentController,
  webhookController,
  listCarriersController,
  getShipmentEventsPublicController
} from './controller/shipment.controller';
import {
  createShipmentSchema,
  orderIdParamSchema,
  shipmentIdParamSchema,
  webhookProviderSchema
} from './dto/shipment.dto';
import { shipmentRateLimit, webhookRateLimit } from './middlewares/shipmentRateLimit';

const router = Router();

// Middleware wrappers
const authMw: RequestHandler = (req, res, next) => {
  void requireAuth(req, res, next);
};

const adminMw: RequestHandler = (req, res, next) => {
  void requireRole('admin')(req, res, next);
};

/**
 * @route   GET /api/v1/shipments/carriers
 * @desc    Get list of supported carriers
 * @access  Public
 */
router.get(
  '/carriers',
  asyncHandler(listCarriersController)
);

/**
 * @route   GET /api/v1/shipments/public/:id/events
 * @desc    Public tracking endpoint (no auth, rate limited)
 * @access  Public (should require verification token in production)
 * @rateLimit 10 requests per minute per IP
 */
router.get(
  '/public/:id/events',
  shipmentRateLimit,
  validateParams(shipmentIdParamSchema),
  asyncHandler(getShipmentEventsPublicController)
);

/**
 * @route   GET /api/v1/shipments/orders/:id/shipments
 * @desc    Get all shipments for an order
 * @access  Private (order owner only)
 */
router.get(
  '/orders/:id/shipments',
  authMw,
  validateParams(orderIdParamSchema),
  asyncHandler(getOrderShipmentsController)
);

/**
 * @route   GET /api/v1/shipments/:id/events
 * @desc    Get shipment tracking events
 * @access  Private (order owner only)
 */
router.get(
  '/:id/events',
  authMw,
  validateParams(shipmentIdParamSchema),
  asyncHandler(getShipmentEventsController)
);

/**
 * @route   POST /api/v1/shipments/orders/:id/shipments
 * @desc    Create new shipment for an order
 * @access  Admin only
 */
router.post(
  '/orders/:id/shipments',
  adminMw,
  validateParams(orderIdParamSchema),
  validateBody(createShipmentSchema),
  asyncHandler(createShipmentController)
);

/**
 * @route   POST /api/v1/shipments/:id/sync
 * @desc    Sync shipment status with provider
 * @access  Admin only
 */
router.post(
  '/:id/sync',
  adminMw,
  validateParams(shipmentIdParamSchema),
  asyncHandler(syncShipmentController)
);

/**
 * @route   POST /api/v1/shipments/webhook/:provider
 * @desc    Webhook endpoint for shipping providers
 * @access  Public (signature verified)
 * @rateLimit 100 requests per minute per IP
 */
router.post(
  '/webhook/:provider',
  webhookRateLimit,
  validateParams(webhookProviderSchema),
  asyncHandler(webhookController)
);

export default router;