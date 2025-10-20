import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import {
  listCommentsController,
  getCommentController,
  createCommentController,
  updateCommentController,
  deleteCommentController,
  getProjectStatsController
} from './controller/comment.controller';
import {
  createCommentSchema,
  updateCommentSchema,
  listCommentsSchema,
  commentIdParamSchema,
  projectIdParamSchema
} from './dto/comment.dto';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/v1/comments
 * @desc    List comments with filters (projectId, layerId, status)
 * @access  Private (requires project access)
 * @query   projectId?, layerId?, status?, page?, limit?
 */
router.get(
  '/',
  validateQuery(listCommentsSchema),
  asyncHandler(listCommentsController)
);

/**
 * @route   GET /api/v1/comments/projects/:projectId/stats
 * @desc    Get comment statistics for a project
 * @access  Private (requires project access)
 * @returns { total: number, open: number, resolved: number }
 */
router.get(
  '/projects/:projectId/stats',
  validateParams(projectIdParamSchema),
  asyncHandler(getProjectStatsController)
);

/**
 * @route   GET /api/v1/comments/:id
 * @desc    Get single comment by ID
 * @access  Private (requires project access)
 */
router.get(
  '/:id',
  validateParams(commentIdParamSchema),
  asyncHandler(getCommentController)
);

/**
 * @route   POST /api/v1/comments
 * @desc    Create new comment on a project/layer
 * @access  Private (requires project membership)
 * @body    { projectId, body, targetLayerId?, rating? }
 */
router.post(
  '/',
  validateBody(createCommentSchema),
  asyncHandler(createCommentController)
);

/**
 * @route   PUT /api/v1/comments/:id
 * @desc    Update comment (author or project owner only)
 * @access  Private (requires ownership)
 * @body    { body?, status?, rating? }
 */
router.put(
  '/:id',
  validateParams(commentIdParamSchema),
  validateBody(updateCommentSchema),
  asyncHandler(updateCommentController)
);

/**
 * @route   DELETE /api/v1/comments/:id
 * @desc    Delete comment (author or project owner only)
 * @access  Private (requires ownership)
 */
router.delete(
  '/:id',
  validateParams(commentIdParamSchema),
  asyncHandler(deleteCommentController)
);

export default router;