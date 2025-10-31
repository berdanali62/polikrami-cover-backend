"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShipmentProvider = getShipmentProvider;
const env_1 = require("../../../config/env");
function getShipmentProvider(name = env_1.env.SHIPMENT_PROVIDER) {
    if (name === 'mock') {
        const { MockShipmentProvider } = require('./mock.provider');
        return new MockShipmentProvider();
    }
    throw new Error(`Unknown shipment provider: ${name}`);
}
