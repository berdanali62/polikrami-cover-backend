"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthHandler = healthHandler;
function healthHandler(_req, res) {
    res.status(200).json({ status: 'ok' });
}
