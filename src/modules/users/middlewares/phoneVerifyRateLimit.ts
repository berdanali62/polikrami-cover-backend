import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { env } from '../../../config/env';

let IORedis: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  IORedis = require('ioredis');
} catch {
  IORedis = null;
}

const limiter = (() => {
  if (env.REDIS_URL && IORedis) {
    const client = new IORedis(env.REDIS_URL);
    return new RateLimiterRedis({
      storeClient: client,
      points: env.RATE_LIMIT_PHONE_VERIFICATION_POINTS,
      duration: env.RATE_LIMIT_PHONE_VERIFICATION_DURATION,
      keyPrefix: 'rl:phone-verify',
      blockDuration: env.RATE_LIMIT_PHONE_VERIFICATION_DURATION,
    });
  }
  return new RateLimiterMemory({ 
    points: env.RATE_LIMIT_PHONE_VERIFICATION_POINTS, 
    duration: env.RATE_LIMIT_PHONE_VERIFICATION_DURATION, 
    blockDuration: env.RATE_LIMIT_PHONE_VERIFICATION_DURATION 
  });
})();

export async function phoneVerifyRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.user?.id || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'anon';
    const rl = await limiter.consume(key);
    res.setHeader('X-RateLimit-Limit', String(env.RATE_LIMIT_PHONE_VERIFICATION_POINTS));
    res.setHeader('X-RateLimit-Remaining', String(rl.remainingPoints));
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rl.msBeforeNext).toISOString());
    next();
  } catch (err: any) {
    const retryAfter = Math.ceil((err?.msBeforeNext || env.RATE_LIMIT_PHONE_VERIFICATION_DURATION * 1000) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.', retryAfter });
  }
}


