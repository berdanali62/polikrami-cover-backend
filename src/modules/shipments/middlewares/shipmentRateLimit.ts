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
 * Rate limiter for public tracking endpoint
 * Lower limit to prevent enumeration attacks
 */
const publicTrackingLimiter = (() => {
  if (env.REDIS_URL && IORedis) {
    const client = new IORedis(env.REDIS_URL);
    return new RateLimiterRedis({
      storeClient: client,
      points: 10, // 10 requests
      duration: 60, // per minute
      keyPrefix: 'rl:shipment:public'
    });
  }
  return new RateLimiterMemory({
    points: 10,
    duration: 60
  });
})();

/**
 * Rate limiter for webhook endpoint
 * Higher limit for legitimate provider webhooks
 */
const webhookLimiter = (() => {
  if (env.REDIS_URL && IORedis) {
    const client = new IORedis(env.REDIS_URL);
    return new RateLimiterRedis({
      storeClient: client,
      points: 100, // 100 requests
      duration: 60, // per minute
      keyPrefix: 'rl:shipment:webhook'
    });
  }
  return new RateLimiterMemory({
    points: 100,
    duration: 60
  });
})();

/**
 * Middleware for public tracking rate limiting
 */
export async function shipmentRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Use IP address as key
    const key = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || 'anon';

    await publicTrackingLimiter.consume(key);
    next();
  } catch (err) {
    console.error('[Shipment] Rate limit exceeded:', {
      ip: req.ip,
      path: req.path
    });

    res.status(429).json({
      message: 'Çok fazla kargo sorgulama isteği. Lütfen bir süre bekleyin.',
      retryAfter: 60
    });
  }
}

/**
 * Middleware for webhook rate limiting
 */
export async function webhookRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Use IP + provider as key
    const provider = req.params.provider || 'unknown';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || 'anon';
    const key = `${provider}:${ip}`;

    await webhookLimiter.consume(key);
    next();
  } catch (err) {
    console.error('[Shipment] Webhook rate limit exceeded:', {
      provider: req.params.provider,
      ip: req.ip
    });

    res.status(429).json({
      message: 'Too many webhook requests',
      retryAfter: 60
    });
  }
}