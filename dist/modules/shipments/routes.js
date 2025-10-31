"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const validation_1 = require("../../middlewares/validation");
const shipment_controller_1 = require("./controller/shipment.controller");
const shipment_dto_1 = require("./dto/shipment.dto");
const shipmentRateLimit_1 = require("./middlewares/shipmentRateLimit");
const router = (0, express_1.Router)();
// Middleware wrappers
const authMw = (req, res, next) => {
    void (0, auth_1.requireAuth)(req, res, next);
};
const adminMw = (req, res, next) => {
    void (0, auth_1.requireRole)('admin')(req, res, next);
};
/**
 * @route   GET /api/v1/shipments/carriers
 * @desc    Get list of supported carriers
 * @access  Public
 */
router.get('/carriers', (0, asyncHandler_1.asyncHandler)(shipment_controller_1.listCarriersController));
/**
 * @route   GET /api/v1/shipments/public/:id/events
 * @desc    Public tracking endpoint (no auth, rate limited)
 * @access  Public (should require verification token in production)
 * @rateLimit 10 requests per minute per IP
 */
router.get('/public/:id/events', shipmentRateLimit_1.shipmentRateLimit, (0, validation_1.validateParams)(shipment_dto_1.shipmentIdParamSchema), (0, asyncHandler_1.asyncHandler)(shipment_controller_1.getShipmentEventsPublicController));
/**
 * @route   GET /api/v1/shipments/orders/:id/shipments
 * @desc    Get all shipments for an order
 * @access  Private (order owner only)
 */
router.get('/orders/:id/shipments', authMw, (0, validation_1.validateParams)(shipment_dto_1.orderIdParamSchema), (0, asyncHandler_1.asyncHandler)(shipment_controller_1.getOrderShipmentsController));
/**
 * @route   GET /api/v1/shipments/:id/events
 * @desc    Get shipment tracking events
 * @access  Private (order owner only)
 */
router.get('/:id/events', authMw, (0, validation_1.validateParams)(shipment_dto_1.shipmentIdParamSchema), (0, asyncHandler_1.asyncHandler)(shipment_controller_1.getShipmentEventsController));
/**
 * @route   POST /api/v1/shipments/orders/:id/shipments
 * @desc    Create new shipment for an order
 * @access  Admin only
 */
router.post('/orders/:id/shipments', adminMw, (0, validation_1.validateParams)(shipment_dto_1.orderIdParamSchema), (0, validation_1.validateBody)(shipment_dto_1.createShipmentSchema), (0, asyncHandler_1.asyncHandler)(shipment_controller_1.createShipmentController));
/**
 * @route   POST /api/v1/shipments/:id/sync
 * @desc    Sync shipment status with provider
 * @access  Admin only
 */
router.post('/:id/sync', adminMw, (0, validation_1.validateParams)(shipment_dto_1.shipmentIdParamSchema), (0, asyncHandler_1.asyncHandler)(shipment_controller_1.syncShipmentController));
/**
 * @route   POST /api/v1/shipments/webhook/:provider
 * @desc    Webhook endpoint for shipping providers
 * @access  Public (signature verified)
 * @rateLimit 100 requests per minute per IP
 */
router.post('/webhook/:provider', shipmentRateLimit_1.webhookRateLimit, (0, validation_1.validateParams)(shipment_dto_1.webhookProviderSchema), (0, asyncHandler_1.asyncHandler)(shipment_controller_1.webhookController));
exports.default = router;
