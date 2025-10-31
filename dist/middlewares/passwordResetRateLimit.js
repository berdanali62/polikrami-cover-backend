"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetRateLimit = passwordResetRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
// Password reset rate limiter (per email)
let passwordResetLimiter;
if (env_1.env.REDIS_URL && IORedis) {
    const client = new IORedis(env_1.env.REDIS_URL);
    passwordResetLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
        storeClient: client,
        points: env_1.env.RATE_LIMIT_PASSWORD_RESET_POINTS,
        duration: env_1.env.RATE_LIMIT_PASSWORD_RESET_DURATION,
        blockDuration: env_1.env.RATE_LIMIT_PASSWORD_RESET_DURATION,
        keyPrefix: 'rl:password_reset',
    });
}
else {
    passwordResetLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
        points: env_1.env.RATE_LIMIT_PASSWORD_RESET_POINTS,
        duration: env_1.env.RATE_LIMIT_PASSWORD_RESET_DURATION,
        blockDuration: env_1.env.RATE_LIMIT_PASSWORD_RESET_DURATION,
    });
}
async function passwordResetRateLimit(req, res, next) {
    try {
        const email = req.body?.email;
        if (!email)
            return next();
        const key = email.toLowerCase();
        await passwordResetLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        res.status(429).json({
            message: 'Too many password reset requests. Please try again later.'
        });
    }
}
