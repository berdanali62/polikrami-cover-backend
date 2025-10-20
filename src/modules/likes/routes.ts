import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateBody, validateParams } from '../../middlewares/validation';
import { requireAuth } from '../../middlewares/auth';
import { toggleLikeSchema, likeSummaryParamsSchema } from './dto/likes.dto';
import { getLikeSummaryController, toggleLikeController } from './controller/likes.controller';
import { likeRateLimit } from './middlewares/likeRateLimit';

const router = Router();

// Auth middleware wrapper
const authMw: RequestHandler = (req, res, next) => { 
  void requireAuth(req, res, next); 
};

/**
 * @route   POST /api/v1/likes/toggle
 * @desc    Toggle like on a message card
 * @access  Private (requires auth)
 */
router.post(
  '/toggle',
  authMw,
  likeRateLimit,
  validateBody(toggleLikeSchema),
  asyncHandler(toggleLikeController)
);

/**
 * @route   GET /api/v1/likes/cards/:id/summary
 * @desc    Get like count for a message card
 * @access  Public
 */
router.get(
  '/cards/:id/summary',
  validateParams(likeSummaryParamsSchema),
  asyncHandler(getLikeSummaryController)
);

export default router;