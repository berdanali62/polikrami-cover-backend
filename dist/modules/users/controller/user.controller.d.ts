import { Request, Response } from 'express';
export declare function meController(req: Request, res: Response): Promise<void>;
export declare function updateProfileController(req: Request, res: Response): Promise<void>;
export declare function changePasswordController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function sendPhoneCodeController(req: Request, res: Response): Promise<void>;
export declare function verifyPhoneCodeController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function firebasePhoneVerifyController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
