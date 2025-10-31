import { Request, Response } from 'express';
export declare function listTemplatesController(_req: Request, res: Response): Promise<void>;
export declare function renderTemplateController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
