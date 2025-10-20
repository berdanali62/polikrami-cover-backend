import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { env } from '../../../config/env';

let IORedis: any;
try {
  IORedis = require('ioredis');
} catch {
  IORedis = null;
}

/**
 * Rate limiter for credit purchases
 * Prevents abuse and fraud
 */
const purchaseLimiter = (() => {
  if (env.REDIS_URL && IORedis) {
    const client = new IORedis(env.REDIS_URL);
    return new RateLimiterRedis({
      storeClient: client,
      points: 5, // 5 purchases
      duration: 3600, // per hour
      keyPrefix: 'rl:wallet:purchase'
    });
  }
  return new RateLimiterMemory({
    points: 5,
    duration: 3600
  });
})();

/**
 * Wallet rate limit middleware
 */
export async function walletRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const key = req.user?.id || req.ip || 'anon';

    const rateLimitRes = await purchaseLimiter.consume(key);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', rateLimitRes.remainingPoints.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimitRes.msBeforeNext).toISOString());

    next();

  } catch (err: any) {
    console.warn('[Wallet] Rate limit exceeded:', {
      userId: req.user?.id,
      ip: req.ip
    });

    const retryAfter = Math.ceil((err.msBeforeNext || 3600000) / 1000);

    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      success: false,
      message: 'Çok fazla satın alma isteği. Lütfen 1 saat sonra tekrar deneyin.',
      retryAfter
    });
  }
}