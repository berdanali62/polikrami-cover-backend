import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  listTemplatesController,
  getTemplateBySlugController,
  getTemplateByIdController,
  createTemplateController,
  updateTemplateController,
  deleteTemplateController,
  getPopularTemplatesController
} from './controller/template.controller';
import {
  listTemplatesSchema,
  createTemplateSchema,
  updateTemplateSchema
} from './dto/template.dto';

const router = Router();

// Parameter validation schemas
const templateIdParam = z.object({
  id: z.string().uuid({ message: 'Geçerli bir şablon ID (UUID) giriniz.' })
});

const templateSlugParam = z.object({
  slug: z.string().min(1, { message: 'Geçerli bir şablon slug\'u giriniz.' })
});

// Public routes
router.get('/', validateQuery(listTemplatesSchema), asyncHandler(listTemplatesController));
router.get('/popular', asyncHandler(getPopularTemplatesController));
router.get('/slug/:slug', validateParams(templateSlugParam), asyncHandler(getTemplateBySlugController));
router.get('/:id', validateParams(templateIdParam), asyncHandler(getTemplateByIdController));

// Protected routes (admin/designer only) - Allow both admin and designer roles
router.post('/', requireAuth, validateBody(createTemplateSchema), asyncHandler(createTemplateController));
router.put('/:id', requireAuth, validateParams(templateIdParam), validateBody(updateTemplateSchema), asyncHandler(updateTemplateController));
router.delete('/:id', requireRole('admin'), validateParams(templateIdParam), asyncHandler(deleteTemplateController)); // Only admin can delete

export default router;
