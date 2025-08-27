import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateParams, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  listMyAssetsController,
  getAssetController,
  deleteAssetController,
  getStorageStatsController
} from './controller/asset.controller';

const router = Router();

// Parameter validation
const assetIdParam = z.object({
  id: z.string().uuid({ message: 'Geçerli bir asset ID (UUID) giriniz.' })
});

// All routes require authentication
router.get('/', requireAuth, asyncHandler(listMyAssetsController));
router.get('/stats', requireAuth, asyncHandler(getStorageStatsController));
router.get('/:id', requireAuth, validateParams(assetIdParam), asyncHandler(getAssetController));
router.delete('/:id', requireAuth, validateParams(assetIdParam), asyncHandler(deleteAssetController));

export default router;
