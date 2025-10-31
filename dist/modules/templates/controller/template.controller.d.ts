import { Request, Response } from 'express';
export declare function listTemplatesController(req: Request, res: Response): Promise<void>;
export declare function getTemplateBySlugController(req: Request, res: Response): Promise<void>;
export declare function getTemplateByIdController(req: Request, res: Response): Promise<void>;
export declare function createTemplateController(req: Request, res: Response): Promise<void>;
export declare function updateTemplateController(req: Request, res: Response): Promise<void>;
export declare function deleteTemplateController(req: Request, res: Response): Promise<void>;
export declare function getPopularTemplatesController(_req: Request, res: Response): Promise<void>;
