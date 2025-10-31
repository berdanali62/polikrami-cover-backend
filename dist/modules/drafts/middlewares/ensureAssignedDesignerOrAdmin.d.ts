import { Request, Response, NextFunction } from 'express';
export declare function ensureAssignedDesignerOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
