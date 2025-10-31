import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
let IORedis: any;
try { IORedis = require('ioredis'); } catch { IORedis = null; }

// Email verification rate limiter (per email)
let emailVerificationLimiter: RateLimiterMemory | RateLimiterRedis;
if (env.REDIS_URL && IORedis) {
  const client = new IORedis(env.REDIS_URL);
  emailVerificationLimiter = new RateLimiterRedis({
    storeClient: client,
    points: env.RATE_LIMIT_EMAIL_VERIFICATION_POINTS,
    duration: env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
    blockDuration: env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
    keyPrefix: 'rl:email_verification',
  });
} else {
  emailVerificationLimiter = new RateLimiterMemory({ 
    points: env.RATE_LIMIT_EMAIL_VERIFICATION_POINTS,
    duration: env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
    blockDuration: env.RATE_LIMIT_EMAIL_VERIFICATION_DURATION,
  });
}

export async function emailVerificationRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.body?.email as string | undefined;
    if (!email) return next();
    
    const key = email.toLowerCase();
    await emailVerificationLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({ 
      message: 'Too many email verification requests. Please try again later.' 
    });
  }
}

