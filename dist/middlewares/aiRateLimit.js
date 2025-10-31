"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRateLimit = aiRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
// Per-user and per-draft limiter
let userLimiter;
let draftLimiter;
if (env_1.env.REDIS_URL && IORedis) {
    const client = new IORedis(env_1.env.REDIS_URL);
    userLimiter = new rate_limiter_flexible_1.RateLimiterRedis({ storeClient: client, points: 30, duration: 60, keyPrefix: 'rl:ai:user' });
    draftLimiter = new rate_limiter_flexible_1.RateLimiterRedis({ storeClient: client, points: 10, duration: 60, keyPrefix: 'rl:ai:draft' });
}
else {
    userLimiter = new rate_limiter_flexible_1.RateLimiterMemory({ points: 30, duration: 60 });
    draftLimiter = new rate_limiter_flexible_1.RateLimiterMemory({ points: 10, duration: 60 });
}
async function aiRateLimit(req, res, next) {
    try {
        const userId = req.user?.id || req.ip || 'anon';
        const draftId = req.params?.id || 'none';
        await Promise.all([
            userLimiter.consume(userId),
            draftLimiter.consume(`${userId}:${draftId}`),
        ]);
        next();
    }
    catch {
        res.status(429).json({ message: 'AI rate limit exceeded' });
    }
}
