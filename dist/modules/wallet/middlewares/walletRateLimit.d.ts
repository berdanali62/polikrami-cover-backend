import { Request, Response, NextFunction } from 'express';
/**
 * Wallet rate limit middleware
 */
export declare function walletRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
