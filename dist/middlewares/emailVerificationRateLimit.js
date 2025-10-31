"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerificationRateLimit = emailVerificationRateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
// Email verification rate limiter (per email)
let emailVerificationLimiter;
if (env_1.env.REDIS_URL && IORedis) {
    const client = new IORedis(env_1.env.REDIS_URL);
    emailVerificationLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
        storeClient: client,
        points: env_1.env.RATE_LIMIT_EMAIL_VERIFICATION_POINTS,
        duration: env_1.env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
        blockDuration: env_1.env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
        keyPrefix: 'rl:email_verification',
    });
}
else {
    emailVerificationLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
        points: env_1.env.RATE_LIMIT_EMAIL_VERIFICATION_POINTS,
        duration: env_1.env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
        blockDuration: env_1.env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
    });
}
async function emailVerificationRateLimit(req, res, next) {
    try {
        const email = req.body?.email;
        if (!email)
            return next();
        const key = email.toLowerCase();
        await emailVerificationLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        res.status(429).json({
            message: 'Too many email verification requests. Please try again later.'
        });
    }
}
