import { Request, Response } from 'express';
/**
 * Global search endpoint
 * GET /api/v1/search?q=kitap&type=all&page=1&limit=20
 */
export declare function globalSearchController(req: Request, res: Response): Promise<void>;
/**
 * Search suggestions (autocomplete)
 * GET /api/v1/search/suggestions?q=kit
 */
export declare function searchSuggestionsController(req: Request, res: Response): Promise<void>;
