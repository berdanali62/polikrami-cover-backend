import { Request, Response } from 'express';
export declare function generateController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function resultsController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function selectController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function regenController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
