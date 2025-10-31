"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRateLimit = walletRateLimit;
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
 * Rate limiter for credit purchases
 * Prevents abuse and fraud
 */
const purchaseLimiter = (() => {
    if (env_1.env.REDIS_URL && IORedis) {
        const client = new IORedis(env_1.env.REDIS_URL);
        return new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: client,
            points: 5, // 5 purchases
            duration: 3600, // per hour
            keyPrefix: 'rl:wallet:purchase'
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: 5,
        duration: 3600
    });
})();
/**
 * Wallet rate limit middleware
 */
async function walletRateLimit(req, res, next) {
    try {
        const key = req.user?.id || req.ip || 'anon';
        const rateLimitRes = await purchaseLimiter.consume(key);
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', '5');
        res.setHeader('X-RateLimit-Remaining', rateLimitRes.remainingPoints.toString());
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimitRes.msBeforeNext).toISOString());
        next();
    }
    catch (err) {
        console.warn('[Wallet] Rate limit exceeded:', {
            userId: req.user?.id,
            ip: req.ip
        });
        const retryAfter = Math.ceil((err.msBeforeNext || 3600000) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
            success: false,
            message: 'Çok fazla satın alma isteği. Lütfen 1 saat sonra tekrar deneyin.',
            retryAfter
        });
    }
}
