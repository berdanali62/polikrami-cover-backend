"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = securityHeaders;
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("../config/env");
function securityHeaders() {
    const csp = {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", 'data:', 'blob:'],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "font-src": ["'self'", 'data:'],
            // Allow API to be called from configured front-end origins
            "connect-src": ["'self'", ...env_1.env.ALLOWED_ORIGINS],
        },
    };
    return (0, helmet_1.default)({ contentSecurityPolicy: csp, hsts: true, referrerPolicy: { policy: 'no-referrer' } });
}
