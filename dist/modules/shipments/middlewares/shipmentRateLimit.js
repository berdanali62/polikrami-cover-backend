"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentRateLimit = shipmentRateLimit;
exports.webhookRateLimit = webhookRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../../../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
/**
 * Rate limiter for public tracking endpoint
 * Lower limit to prevent enumeration attacks
 */
const publicTrackingLimiter = (() => {
    if (env_1.env.REDIS_URL && IORedis) {
        const client = new IORedis(env_1.env.REDIS_URL);
        return new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: client,
            points: 10, // 10 requests
            duration: 60, // per minute
            keyPrefix: 'rl:shipment:public'
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: 10,
        duration: 60
    });
})();
/**
 * Rate limiter for webhook endpoint
 * Higher limit for legitimate provider webhooks
 */
const webhookLimiter = (() => {
    if (env_1.env.REDIS_URL && IORedis) {
        const client = new IORedis(env_1.env.REDIS_URL);
        return new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: client,
            points: 100, // 100 requests
            duration: 60, // per minute
            keyPrefix: 'rl:shipment:webhook'
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: 100,
        duration: 60
    });
})();
/**
 * Middleware for public tracking rate limiting
 */
async function shipmentRateLimit(req, res, next) {
    try {
        // Use IP address as key
        const key = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.ip
            || 'anon';
        await publicTrackingLimiter.consume(key);
        next();
    }
    catch (err) {
        console.error('[Shipment] Rate limit exceeded:', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            message: 'Çok fazla kargo sorgulama isteği. Lütfen bir süre bekleyin.',
            retryAfter: 60
        });
    }
}
/**
 * Middleware for webhook rate limiting
 */
async function webhookRateLimit(req, res, next) {
    try {
        // Use IP + provider as key
        const provider = req.params.provider || 'unknown';
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.ip
            || 'anon';
        const key = `${provider}:${ip}`;
        await webhookLimiter.consume(key);
        next();
    }
    catch (err) {
        console.error('[Shipment] Webhook rate limit exceeded:', {
            provider: req.params.provider,
            ip: req.ip
        });
        res.status(429).json({
            message: 'Too many webhook requests',
            retryAfter: 60
        });
    }
}
