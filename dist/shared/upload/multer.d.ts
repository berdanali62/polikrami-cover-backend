import { Request, Response, NextFunction } from 'express';
export declare const uploadMiddleware: import("multer").MulterInstance;
export declare function attachRelativePath(req: Request, _res: Response, next: NextFunction): void;
export declare function validateMagicBytes(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function sanitizeImage(req: Request, res: Response, next: NextFunction): Promise<void>;
