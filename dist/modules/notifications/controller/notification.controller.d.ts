import { Request, Response } from 'express';
export declare function listMyNotificationsController(req: Request, res: Response): Promise<void>;
export declare function markNotificationAsReadController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markAllAsReadController(req: Request, res: Response): Promise<void>;
export declare function deleteNotificationController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
