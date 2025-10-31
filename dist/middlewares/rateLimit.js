"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
// Prefer Redis if configured
let limiter;
if (env_1.env.REDIS_URL && IORedis) {
    const client = new IORedis(env_1.env.REDIS_URL);
    limiter = new rate_limiter_flexible_1.RateLimiterRedis({
        storeClient: client,
        points: 60, // 60 requests per minute instead of 100 - more secure
        duration: 60,
        blockDuration: 60,
        execEvenly: true,
        keyPrefix: 'rl:global',
    });
}
else {
    limiter = new rate_limiter_flexible_1.RateLimiterMemory({
        points: 60, // 60 requests per minute - consistent with Redis version
        duration: 60,
        blockDuration: 60, // Block for 60 seconds
        execEvenly: true // Spread requests evenly across duration
    });
}
async function rateLimitMiddleware(req, res, next) {
    try {
        const key = req.ip ?? 'global';
        await limiter.consume(key);
        next();
    }
    catch {
        res.status(429).json({ message: 'Too Many Requests' });
    }
}
