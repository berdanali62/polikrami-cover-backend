import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { env } from '../../../config/env';

let IORedis: any;
try { 
  IORedis = require('ioredis'); 
} catch { 
  IORedis = null; 
}

// Search has higher rate limit than other endpoints
const limiter = (() => {
  if (env.REDIS_URL && IORedis) {
    const client = new IORedis(env.REDIS_URL);
    return new RateLimiterRedis({ 
      storeClient: client, 
      points: 30, // 30 requests
      duration: 60, // per minute
      keyPrefix: 'rl:search' 
    });
  }
  return new RateLimiterMemory({ 
    points: 30, 
    duration: 60 
  });
})();

export async function searchRateLimit(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Use IP for anonymous, user ID for authenticated
    const key = req.user?.id 
      || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip 
      || 'anon';
    
    await limiter.consume(key);
    next();
  } catch (err) {
    console.error('[Search] Rate limit exceeded:', { 
      userId: req.user?.id, 
      ip: req.ip,
      path: req.path 
    });
    
    res.status(429).json({ 
      message: 'Çok fazla arama isteği. Lütfen bir süre bekleyin.',
      retryAfter: 60 
    });
  }
}