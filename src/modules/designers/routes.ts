import { Router } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { requireAuth } from '../../middlewares/auth';
import { listDesignersController, recommendedDesignersController, listDesignersSortedController, createReviewController, listReviewsController } from './controller/designers.controller';
import { publicProfileController, searchDesignersController } from './controller/public.controller';

const router = Router();

router.get('/', requireAuth, asyncHandler(listDesignersController));
router.get('/recommended', requireAuth, asyncHandler(recommendedDesignersController));
router.get('/sorted', requireAuth, asyncHandler(listDesignersSortedController));
router.post('/:id/reviews', requireAuth, asyncHandler(createReviewController));
router.get('/:id/reviews', requireAuth, asyncHandler(listReviewsController));
// Public endpoints
router.get('/public/:id', asyncHandler(publicProfileController));
router.get('/public', asyncHandler(searchDesignersController));

export default router;


