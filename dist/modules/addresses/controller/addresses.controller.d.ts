import { Request, Response } from 'express';
/**
 * List user addresses
 * GET /api/v1/addresses
 */
export declare function listAddressesController(req: Request, res: Response): Promise<void>;
/**
 * Get single address
 * GET /api/v1/addresses/:id
 */
export declare function getAddressController(req: Request, res: Response): Promise<void>;
/**
 * Create new address
 * POST /api/v1/addresses
 */
export declare function createAddressController(req: Request, res: Response): Promise<void>;
/**
 * Update existing address
 * PUT /api/v1/addresses/:id
 */
export declare function updateAddressController(req: Request, res: Response): Promise<void>;
/**
 * Set address as default
 * POST /api/v1/addresses/:id/default
 */
export declare function setDefaultAddressController(req: Request, res: Response): Promise<void>;
/**
 * Delete address
 * DELETE /api/v1/addresses/:id
 */
export declare function deleteAddressController(req: Request, res: Response): Promise<void>;
/**
 * Get default address
 * GET /api/v1/addresses/default
 */
export declare function getDefaultAddressController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
