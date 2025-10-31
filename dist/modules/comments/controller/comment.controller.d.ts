import { Request, Response } from 'express';
/**
 * List comments with filters and pagination
 * GET /api/v1/comments?projectId=xxx&status=open&page=1&limit=20
 */
export declare function listCommentsController(req: Request, res: Response): Promise<void>;
/**
 * Get single comment by ID
 * GET /api/v1/comments/:id
 */
export declare function getCommentController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new comment
 * POST /api/v1/comments
 */
export declare function createCommentController(req: Request, res: Response): Promise<void>;
/**
 * Update comment
 * PUT /api/v1/comments/:id
 */
export declare function updateCommentController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete comment
 * DELETE /api/v1/comments/:id
 */
export declare function deleteCommentController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get comment statistics for a project
 * GET /api/v1/comments/projects/:projectId/stats
 */
export declare function getProjectStatsController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
