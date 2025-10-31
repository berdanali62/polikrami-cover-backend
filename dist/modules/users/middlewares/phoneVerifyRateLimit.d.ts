import { Request, Response, NextFunction } from 'express';
export declare function phoneVerifyRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
