import { Request, Response, NextFunction } from 'express';
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requireRole(role: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
