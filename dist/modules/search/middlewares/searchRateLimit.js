"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRateLimit = searchRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../../../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
// Search has higher rate limit than other endpoints
const limiter = (() => {
    if (env_1.env.REDIS_URL && IORedis) {
        const client = new IORedis(env_1.env.REDIS_URL);
        return new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: client,
            points: 30, // 30 requests
            duration: 60, // per minute
            keyPrefix: 'rl:search'
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: 30,
        duration: 60
    });
})();
async function searchRateLimit(req, res, next) {
    try {
        // Use IP for anonymous, user ID for authenticated
        const key = req.user?.id
            || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.ip
            || 'anon';
        await limiter.consume(key);
        next();
    }
    catch (err) {
        console.error('[Search] Rate limit exceeded:', {
            userId: req.user?.id,
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            message: 'Çok fazla arama isteği. Lütfen bir süre bekleyin.',
            retryAfter: 60
        });
    }
}
