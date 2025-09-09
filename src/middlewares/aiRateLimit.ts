import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
let IORedis: any;
try { IORedis = require('ioredis'); } catch { IORedis = null; }

// Per-user and per-draft limiter
let userLimiter: RateLimiterMemory | RateLimiterRedis;
let draftLimiter: RateLimiterMemory | RateLimiterRedis;

if (env.REDIS_URL && IORedis) {
  const client = new IORedis(env.REDIS_URL);
  userLimiter = new RateLimiterRedis({ storeClient: client, points: 30, duration: 60, keyPrefix: 'rl:ai:user' });
  draftLimiter = new RateLimiterRedis({ storeClient: client, points: 10, duration: 60, keyPrefix: 'rl:ai:draft' });
} else {
  userLimiter = new RateLimiterMemory({ points: 30, duration: 60 });
  draftLimiter = new RateLimiterMemory({ points: 10, duration: 60 });
}

export async function aiRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || req.ip || 'anon';
    const draftId = (req.params?.id as string) || 'none';
    await Promise.all([
      userLimiter.consume(userId),
      draftLimiter.consume(`${userId}:${draftId}`),
    ]);
    next();
  } catch {
    res.status(429).json({ message: 'AI rate limit exceeded' });
  }
}


