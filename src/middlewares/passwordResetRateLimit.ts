import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
let IORedis: any;
try { IORedis = require('ioredis'); } catch { IORedis = null; }

// Password reset rate limiter (per email)
let passwordResetLimiter: RateLimiterMemory | RateLimiterRedis;
if (env.REDIS_URL && IORedis) {
  const client = new IORedis(env.REDIS_URL);
  passwordResetLimiter = new RateLimiterRedis({
    storeClient: client,
    points: env.RATE_LIMIT_PASSWORD_RESET_POINTS,
    duration: env.RATE_LIMIT_PASSWORD_RESET_DURATION,
    blockDuration: env.RATE_LIMIT_PASSWORD_RESET_DURATION,
    keyPrefix: 'rl:password_reset',
  });
} else {
  passwordResetLimiter = new RateLimiterMemory({ 
    points: env.RATE_LIMIT_PASSWORD_RESET_POINTS,
    duration: env.RATE_LIMIT_PASSWORD_RESET_DURATION,
    blockDuration: env.RATE_LIMIT_PASSWORD_RESET_DURATION,
  });
}

export async function passwordResetRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.body?.email as string | undefined;
    if (!email) return next();
    
    const key = email.toLowerCase();
    await passwordResetLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({ 
      message: 'Too many password reset requests. Please try again later.' 
    });
  }
}

