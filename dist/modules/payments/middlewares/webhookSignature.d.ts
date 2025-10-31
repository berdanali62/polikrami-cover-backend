import { Request, Response, NextFunction } from 'express';
/**
 * Payment webhook signature verification middleware
 *
 * Currently supports:
 * - Iyzico: HMAC SHA256 signature verification
 * - Mock: Skip verification (development only)
 *
 * Usage:
 * router.post('/callback',
 *   verifyPaymentWebhook,  // Skip for mock in dev
 *   validateBody(paymentCallbackSchema),
 *   asyncHandler(paymentCallbackController)
 * );
 */
export declare function verifyPaymentWebhook(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
