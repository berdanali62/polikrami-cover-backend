import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validation';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from './dto/project.dto';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { addMemberController, createProjectController, deleteProjectController, getProjectController, listMembersController, listProjectsController, removeMemberController, updateProjectController } from './controller/project.controller';
import { z } from 'zod';
import { validateParams } from '../../middlewares/validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid({ message: 'Geçerli bir proje ID (UUID) giriniz.' }) });
const memberParamsSchema = z.object({
	id: z.string().uuid({ message: 'Geçerli bir proje ID (UUID) giriniz.' }),
	userId: z.string().uuid({ message: 'Geçerli bir kullanıcı ID (UUID) giriniz.' }),
});

router.get('/', requireAuth, asyncHandler(listProjectsController));
router.post('/', requireAuth, validateBody(createProjectSchema), asyncHandler(createProjectController));
router.get('/:id', requireAuth, validateParams(idParamSchema), asyncHandler(getProjectController));
router.put('/:id', requireAuth, validateParams(idParamSchema), validateBody(updateProjectSchema), asyncHandler(updateProjectController));
router.delete('/:id', requireAuth, validateParams(idParamSchema), asyncHandler(deleteProjectController));

router.get('/:id/members', requireAuth, validateParams(idParamSchema), asyncHandler(listMembersController));
router.post('/:id/members', requireAuth, validateParams(idParamSchema), validateBody(addMemberSchema), asyncHandler(addMemberController));
router.delete('/:id/members/:userId', requireAuth, validateParams(memberParamsSchema), asyncHandler(removeMemberController));

export default router;


