"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneVerifyRateLimit = phoneVerifyRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../../../config/env");
let IORedis;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
            points: env_1.env.RATE_LIMIT_PHONE_VERIFICATION_POINTS,
            duration: env_1.env.RATE_LIMIT_PHONE_VERIFICATION_DURATION,
            keyPrefix: 'rl:phone-verify',
            blockDuration: env_1.env.RATE_LIMIT_PHONE_VERIFICATION_DURATION,
        });
    }
    return new rate_limiter_flexible_1.RateLimiterMemory({
        points: env_1.env.RATE_LIMIT_PHONE_VERIFICATION_POINTS,
        duration: env_1.env.RATE_LIMIT_PHONE_VERIFICATION_DURATION,
        blockDuration: env_1.env.RATE_LIMIT_PHONE_VERIFICATION_DURATION
    });
})();
async function phoneVerifyRateLimit(req, res, next) {
    try {
        const key = req.user?.id || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'anon';
        const rl = await limiter.consume(key);
        res.setHeader('X-RateLimit-Limit', String(env_1.env.RATE_LIMIT_PHONE_VERIFICATION_POINTS));
        res.setHeader('X-RateLimit-Remaining', String(rl.remainingPoints));
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rl.msBeforeNext).toISOString());
        next();
    }
    catch (err) {
        const retryAfter = Math.ceil((err?.msBeforeNext || env_1.env.RATE_LIMIT_PHONE_VERIFICATION_DURATION * 1000) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        res.status(429).json({ message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.', retryAfter });
    }
}
