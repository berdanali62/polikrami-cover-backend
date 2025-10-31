import { Request, Response, NextFunction } from 'express';
export declare function aiRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
