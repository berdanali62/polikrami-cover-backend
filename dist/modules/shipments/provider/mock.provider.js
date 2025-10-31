"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockShipmentProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
class MockShipmentProvider {
    async registerTracking(_params) {
        return { externalId: crypto_1.default.randomUUID() };
    }
    async fetchCurrentStatus(_ref) {
        return { status: 'in_transit' };
    }
    async fetchEvents(_ref) {
        const now = new Date();
        return [
            { occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), status: 'label_created', description: 'Label created' },
            { occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 12), status: 'in_transit', description: 'Departed facility' },
        ];
    }
    async verifyWebhookSignature(_req) {
        // Always true for mock
        return true;
    }
    async parseWebhookPayload(req) {
        const body = req.body;
        if (!body || !body.trackingNumber || !body.carrierCode)
            return null;
        const events = Array.isArray(body.events)
            ? body.events.map((e) => ({
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
exports.MockShipmentProvider = MockShipmentProvider;
