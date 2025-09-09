import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
let IORedis: any;
try { IORedis = require('ioredis'); } catch { IORedis = null; }

// Prefer Redis if configured
let limiter: RateLimiterMemory | RateLimiterRedis;
if (env.REDIS_URL && IORedis) {
  const client = new IORedis(env.REDIS_URL);
  limiter = new RateLimiterRedis({
    storeClient: client,
    points: 60, // 60 requests per minute instead of 100 - more secure
    duration: 60,
    blockDuration: 60,
    execEvenly: true,
    keyPrefix: 'rl:global',
  });
} else {
  limiter = new RateLimiterMemory({ 
    points: 60, // 60 requests per minute - consistent with Redis version
    duration: 60,
    blockDuration: 60, // Block for 60 seconds
    execEvenly: true // Spread requests evenly across duration
  });
}

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip ?? 'global';
    await limiter.consume(key);
    next();
  } catch {
    res.status(429).json({ message: 'Too Many Requests' });
  }
}

