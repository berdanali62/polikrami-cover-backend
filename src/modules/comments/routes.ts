import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  listCommentsController,
  getCommentController,
  createCommentController,
  updateCommentController,
  deleteCommentController
} from './controller/comment.controller';
import {
  createCommentSchema,
  updateCommentSchema,
  listCommentsSchema
} from './dto/comment.dto';

const router = Router();

// Parameter validation
const commentIdParam = z.object({
  id: z.string().uuid({ message: 'Geçerli bir yorum ID (UUID) giriniz.' })
});

// Protected routes (require authentication)
router.get('/', requireAuth, validateQuery(listCommentsSchema), asyncHandler(listCommentsController));
router.get('/:id', requireAuth, validateParams(commentIdParam), asyncHandler(getCommentController));
router.post('/', requireAuth, validateBody(createCommentSchema), asyncHandler(createCommentController));
router.put('/:id', requireAuth, validateParams(commentIdParam), validateBody(updateCommentSchema), asyncHandler(updateCommentController));
router.delete('/:id', requireAuth, validateParams(commentIdParam), asyncHandler(deleteCommentController));

export default router;
