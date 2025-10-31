import { Request, Response, NextFunction } from 'express';
export declare function passwordResetRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
