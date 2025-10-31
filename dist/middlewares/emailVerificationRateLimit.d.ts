import { Request, Response, NextFunction } from 'express';
export declare function emailVerificationRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
