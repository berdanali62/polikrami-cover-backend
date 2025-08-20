import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const limiter = new RateLimiterMemory({ points: 100, duration: 60 });

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip ?? 'global';
    await limiter.consume(key);
    next();
  } catch {
    res.status(429).json({ message: 'Too Many Requests' });
  }
}

