"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentWebhook = verifyPaymentWebhook;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../../config/env");
const logger_1 = require("../../../utils/logger");
/**
 * Payment webhook signature verification middleware
 *
 * Currently supports:
 * - Iyzico: HMAC SHA256 signature verification
 * - Mock: Skip verification (development only)
 *
 * Usage:
 * router.post('/callback',
 *   verifyPaymentWebhook,  // Skip for mock in dev
 *   validateBody(paymentCallbackSchema),
 *   asyncHandler(paymentCallbackController)
 * );
 */
function verifyPaymentWebhook(req, res, next) {
    // Skip signature verification for mock provider in development/test
    if (env_1.env.PAYMENT_PROVIDER === 'mock' && (env_1.env.NODE_ENV === 'development' || env_1.env.NODE_ENV === 'test')) {
        logger_1.logger.debug('Skipping webhook signature verification for mock provider');
        return next();
    }
    // Determine provider from request or config
    const provider = env_1.env.PAYMENT_PROVIDER || 'iyzico';
    try {
        switch (provider) {
            case 'iyzico':
                return verifyIyzicoSignature(req, res, next);
            case 'mock':
                // In production, mock provider should not be used
                logger_1.logger.warn('Mock provider detected in non-development environment');
                return res.status(403).json({ message: 'Mock provider not allowed in production' });
            default:
                logger_1.logger.warn({ provider }, 'Unknown payment provider for webhook verification');
                return res.status(400).json({ message: 'Unknown payment provider' });
        }
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Webhook signature verification failed');
        return res.status(500).json({ message: 'Signature verification error' });
    }
}
/**
 * Verify Iyzico webhook signature
 *
 * Iyzico sends webhook notifications with HMAC SHA256 signature
 * in the 'x-iyzico-signature' header.
 */
function verifyIyzicoSignature(req, res, next) {
    const signature = req.headers['x-iyzico-signature'];
    if (!signature) {
        logger_1.logger.warn({ ip: req.ip }, 'Missing Iyzico webhook signature');
        return res.status(401).json({ message: 'Missing signature' });
    }
    if (!env_1.env.IYZICO_SECRET_KEY) {
        logger_1.logger.error('Iyzico secret key not configured');
        return res.status(500).json({ message: 'Payment provider configuration error' });
    }
    try {
        // Get request body as string (body parser should preserve raw body or use body)
        // For Express, we need to get the raw body or reconstruct from parsed body
        const bodyString = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);
        // Iyzico signature format: HMAC-SHA256 of request body
        const hash = crypto_1.default
            .createHmac('sha256', env_1.env.IYZICO_SECRET_KEY)
            .update(bodyString)
            .digest('hex');
        // Compare signatures (constant-time comparison to prevent timing attacks)
        const providedSignature = signature.toLowerCase();
        const computedSignature = hash.toLowerCase();
        if (!crypto_1.default.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(computedSignature))) {
            logger_1.logger.warn({
                ip: req.ip,
                providedSignature: providedSignature.substring(0, 8) + '...',
                computedSignature: computedSignature.substring(0, 8) + '...'
            }, 'Invalid Iyzico webhook signature');
            return res.status(401).json({ message: 'Invalid signature' });
        }
        logger_1.logger.debug('Iyzico webhook signature verified successfully');
        next();
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Iyzico signature verification error');
        return res.status(500).json({ message: 'Signature verification error' });
    }
}
