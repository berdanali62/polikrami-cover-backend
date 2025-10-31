import { Request, Response } from 'express';
export declare function listMyReturnsController(req: Request, res: Response): Promise<void>;
export declare function createReturnController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateReturnStatusController(req: Request, res: Response): Promise<void>;
