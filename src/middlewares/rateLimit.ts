import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// TODO: Use Redis for production to prevent memory leaks
// const limiter = new RateLimiterRedis({ ... });
const limiter = new RateLimiterMemory({ 
  points: 100, 
  duration: 60,
  blockDuration: 60, // Block for 60 seconds
  execEvenly: true // Spread requests evenly across duration
});

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip ?? 'global';
    await limiter.consume(key);
    next();
  } catch {
    res.status(429).json({ message: 'Too Many Requests' });
  }
}

