import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { env } from '../../../config/env';

let IORedis: any;
try { 
  IORedis = require('ioredis'); 
} catch { 
  IORedis = null; 
}

const limiter = (() => {
  if (env.REDIS_URL && IORedis) {
    const client = new IORedis(env.REDIS_URL);
    return new RateLimiterRedis({ 
      storeClient: client, 
      points: 15, 
      duration: 60, 
      keyPrefix: 'rl:likes' 
    });
  }
  return new RateLimiterMemory({ 
    points: 15, 
    duration: 60 
  });
})();

export async function likeRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    // Prefer user ID, fallback to X-Forwarded-For or IP
    const key = req.user?.id 
      || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip 
      || 'anon';
    
    await limiter.consume(key);
    next();
  } catch (err) {
    console.error('[Like] Rate limit exceeded:', { 
      userId: req.user?.id, 
      ip: req.ip 
    });
    res.status(429).json({ 
      message: 'Too many like requests. Please try again later.' 
    });
  }
}