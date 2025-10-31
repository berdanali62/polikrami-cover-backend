"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRateLimit = contactRateLimit;
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
 * Strict rate limiter for contact form
 * Prevents spam and abuse
 */
const contactLimiter = (() => {
    if (env_1.env.REDIS_URL && IORedis) {
        const client = new IORedis(env_1.env.REDIS_URL);
        return new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: client,
            points: 3, // 3 submissions
            duration: 600, // per 10 minutes
            keyPrefix: 'rl:contact',
            blockDuration: 600 // Block for 10 minutes if exceeded
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: 3,
        duration: 600,
        blockDuration: 600
    });
})();
/**
 * Contact form rate limit middleware
 */
async function contactRateLimit(req, res, next) {
    try {
        // Use IP address as key
        const key = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.ip
            || 'anon';
        const rateLimitRes = await contactLimiter.consume(key);
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', '3');
        res.setHeader('X-RateLimit-Remaining', rateLimitRes.remainingPoints.toString());
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimitRes.msBeforeNext).toISOString());
        next();
    }
    catch (err) {
        console.warn('[Contact] Rate limit exceeded:', {
            ip: req.ip,
            remainingPoints: err.remainingPoints
        });
        const retryAfter = Math.ceil((err.msBeforeNext || 600000) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
            success: false,
            message: 'Çok fazla mesaj gönderdiniz. Lütfen 10 dakika sonra tekrar deneyin.',
            retryAfter
        });
    }
}
