import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody, validateParams } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  listCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
} from './controller/category.controller';
import {
  createCategorySchema,
  updateCategorySchema
} from './dto/category.dto';

const router = Router();

// Parameter validation
const categoryIdParam = z.object({
  id: z.string().regex(/^\d+$/, { message: 'Geçerli bir kategori ID (sayı) giriniz.' })
});

// Public routes
router.get('/', asyncHandler(listCategoriesController));
router.get('/:id', validateParams(categoryIdParam), asyncHandler(getCategoryController));

// Protected routes (admin only)
router.post('/', requireRole('admin'), validateBody(createCategorySchema), asyncHandler(createCategoryController));
router.put('/:id', requireRole('admin'), validateParams(categoryIdParam), validateBody(updateCategorySchema), asyncHandler(updateCategoryController));
router.delete('/:id', requireRole('admin'), validateParams(categoryIdParam), asyncHandler(deleteCategoryController));

export default router;
