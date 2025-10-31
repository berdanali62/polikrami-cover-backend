"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeRateLimit = likeRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../../../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
const limiter = (() => {
    if (env_1.env.REDIS_URL && IORedis) {
        const client = new IORedis(env_1.env.REDIS_URL);
        return new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: client,
            points: 15,
            duration: 60,
            keyPrefix: 'rl:likes'
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: 15,
        duration: 60
    });
})();
async function likeRateLimit(req, res, next) {
    try {
        // Prefer user ID, fallback to X-Forwarded-For or IP
        const key = req.user?.id
            || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.ip
            || 'anon';
        await limiter.consume(key);
        next();
    }
    catch (err) {
        console.error('[Like] Rate limit exceeded:', {
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(429).json({
            message: 'Too many like requests. Please try again later.'
        });
    }
}
