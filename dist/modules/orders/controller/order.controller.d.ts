import { Request, Response } from 'express';
export declare function listMyOrdersController(req: Request, res: Response): Promise<void>;
export declare function getOrderController(req: Request, res: Response): Promise<void>;
export declare function updateOrderStatusTestController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function cancelOrderController(req: Request, res: Response): Promise<void>;
