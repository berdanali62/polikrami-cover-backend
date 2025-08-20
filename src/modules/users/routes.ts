import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validation';
import { updateProfileSchema } from './dto/profile.dto';
import { meController, updateProfileController, changePasswordController } from './controller/user.controller';
import { changePasswordSchema } from './dto/password.dto';
import { asyncHandler } from '../../shared/helpers/asyncHandler';

const router = Router();

router.get('/me', requireAuth, asyncHandler(meController));
router.put('/me', requireAuth, validateBody(updateProfileSchema), asyncHandler(updateProfileController));
router.post('/me/change-password', requireAuth, validateBody(changePasswordSchema), asyncHandler(changePasswordController));

export default router;

