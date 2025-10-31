"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderShipmentsController = getOrderShipmentsController;
exports.getShipmentEventsController = getShipmentEventsController;
exports.getShipmentEventsPublicController = getShipmentEventsPublicController;
exports.createShipmentController = createShipmentController;
exports.syncShipmentController = syncShipmentController;
exports.webhookController = webhookController;
exports.listCarriersController = listCarriersController;
const ShipmentService_1 = require("../service/ShipmentService");
const shipment_dto_1 = require("../dto/shipment.dto");
const service = new ShipmentService_1.ShipmentService();
/**
 * Get all shipments for an order
 * GET /api/v1/shipments/orders/:id/shipments
 */
async function getOrderShipmentsController(req, res) {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    const orderId = req.params.id || '';
    const shipments = await service.getOrderShipments(userId, orderId);
    res.status(200).json({ shipments });
}
/**
 * Get shipment events (tracking history)
 * GET /api/v1/shipments/:id/events
 */
async function getShipmentEventsController(req, res) {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    const shipmentId = req.params.id || '';
    const result = await service.getShipmentEvents(userId, shipmentId);
    res.status(200).json(result);
}
/**
 * Public tracking endpoint
 * GET /api/v1/shipments/public/:id/events
 */
async function getShipmentEventsPublicController(req, res) {
    const shipmentId = req.params.id || '';
    const verificationToken = req.query.token;
    const result = await service.getShipmentEventsPublic(shipmentId, verificationToken);
    res.status(200).json(result);
}
/**
 * Create new shipment (admin only)
 * POST /api/v1/shipments/orders/:id/shipments
 */
async function createShipmentController(req, res) {
    const orderId = req.params.id || '';
    const data = shipment_dto_1.createShipmentSchema.parse(req.body);
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
async function syncShipmentController(req, res) {
    const shipmentId = req.params.id || '';
    const result = await service.syncShipment(shipmentId);
    res.status(200).json(result);
}
/**
 * Webhook endpoint for shipping providers
 * POST /api/v1/shipments/webhook/:provider
 */
async function webhookController(req, res) {
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
async function listCarriersController(_req, res) {
    const carriers = service.getCarriersList();
    res.status(200).json({ carriers });
}
