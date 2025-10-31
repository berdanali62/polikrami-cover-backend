import { Request, Response, NextFunction } from 'express';
/**
 * Contact form rate limit middleware
 */
export declare function contactRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
