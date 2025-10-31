import { Request, Response, NextFunction } from 'express';
export declare function searchRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
