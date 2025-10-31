import { Request, Response } from 'express';
export declare function listDesignersController(_req: Request, res: Response): Promise<void>;
export declare function recommendedDesignersController(_req: Request, res: Response): Promise<void>;
export declare function listDesignersSortedController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createReviewController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function listReviewsController(req: Request, res: Response): Promise<void>;
