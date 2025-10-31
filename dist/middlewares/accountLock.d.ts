import { Request, Response, NextFunction } from 'express';
export declare function checkAccountLock(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function recordLoginFailure(userId: string): Promise<void>;
export declare function recordLoginSuccess(userId: string): Promise<void>;
