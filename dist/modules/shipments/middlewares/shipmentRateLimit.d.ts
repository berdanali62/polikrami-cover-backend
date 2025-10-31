import { Request, Response, NextFunction } from 'express';
/**
 * Middleware for public tracking rate limiting
 */
export declare function shipmentRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware for webhook rate limiting
 */
export declare function webhookRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
