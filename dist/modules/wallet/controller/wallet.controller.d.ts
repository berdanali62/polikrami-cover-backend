import { Request, Response } from 'express';
/**
 * Get current balance
 * GET /api/v1/wallet
 */
export declare function getBalanceController(req: Request, res: Response): Promise<void>;
/**
 * Get transaction history
 * GET /api/v1/wallet/history?page=1&limit=20&type=all
 */
export declare function getHistoryController(req: Request, res: Response): Promise<void>;
/**
 * Get wallet statistics
 * GET /api/v1/wallet/stats
 */
export declare function getStatsController(req: Request, res: Response): Promise<void>;
/**
 * Admin: Grant credits to user
 * POST /api/v1/wallet/grant
 */
export declare function grantCreditsController(req: Request, res: Response): Promise<void>;
/**
 * Purchase credits
 * POST /api/v1/wallet/purchase
 * NOTE: This should be called AFTER payment is completed
 */
export declare function purchaseCreditsController(req: Request, res: Response): Promise<void>;
