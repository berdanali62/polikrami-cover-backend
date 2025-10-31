import { Request, Response } from 'express';
/**
 * Submit contact form
 * POST /api/v1/contact
 */
export declare function contactController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get contact submissions (admin only)
 * GET /api/v1/contact/submissions
 */
export declare function getSubmissionsController(req: Request, res: Response): Promise<void>;
/**
 * Update submission status (admin only)
 * PATCH /api/v1/contact/submissions/:id
 */
export declare function updateSubmissionController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
