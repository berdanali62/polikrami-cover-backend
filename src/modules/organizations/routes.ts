import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody, validateParams } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  listMyOrganizationsController,
  getOrganizationController,
  createOrganizationController,
  updateOrganizationController,
  deleteOrganizationController,
  addMemberController,
  updateMemberRoleController,
  removeMemberController
} from './controller/organization.controller';
import { createOrganizationSchema, updateOrganizationSchema, addMemberSchema, updateMemberRoleSchema } from './dto/organization.dto';

const router = Router();

const idParam = z.object({ id: z.string().uuid() });
const userIdParam = z.object({ userId: z.string().uuid() });

router.get('/', requireAuth, asyncHandler(listMyOrganizationsController));
router.get('/:id', requireAuth, validateParams(idParam), asyncHandler(getOrganizationController));
router.post('/', requireAuth, validateBody(createOrganizationSchema), asyncHandler(createOrganizationController));
router.put('/:id', requireAuth, validateParams(idParam), validateBody(updateOrganizationSchema), asyncHandler(updateOrganizationController));
router.delete('/:id', requireAuth, validateParams(idParam), asyncHandler(deleteOrganizationController));

router.post('/:id/members', requireAuth, validateParams(idParam), validateBody(addMemberSchema), asyncHandler(addMemberController));
router.put('/:id/members/:userId', requireAuth, validateParams(idParam.merge(userIdParam)), validateBody(updateMemberRoleSchema), asyncHandler(updateMemberRoleController));
router.delete('/:id/members/:userId', requireAuth, validateParams(idParam.merge(userIdParam)), asyncHandler(removeMemberController));

export default router;


