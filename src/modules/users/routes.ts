import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validation';
import { updateProfileSchema } from './dto/profile.dto';
import { meController, updateProfileController, changePasswordController, sendPhoneCodeController, verifyPhoneCodeController, firebasePhoneVerifyController } from './controller/user.controller';
import { phoneVerifyRateLimit } from './middlewares/phoneVerifyRateLimit';
import { changePasswordSchema } from './dto/password.dto';
import { asyncHandler } from '../../shared/helpers/asyncHandler';

const router = Router();

router.get('/me', requireAuth, asyncHandler(meController));
router.put('/me', requireAuth, validateBody(updateProfileSchema), asyncHandler(updateProfileController));
router.put('/profile', requireAuth, validateBody(updateProfileSchema), asyncHandler(updateProfileController));
router.post('/me/change-password', requireAuth, validateBody(changePasswordSchema), asyncHandler(changePasswordController));
router.put('/password', requireAuth, validateBody(changePasswordSchema), asyncHandler(changePasswordController));
router.post('/phone/send-code', requireAuth, phoneVerifyRateLimit, asyncHandler(sendPhoneCodeController));
router.post('/phone/verify', requireAuth, asyncHandler(verifyPhoneCodeController));
router.post('/phone/firebase-verify', requireAuth, asyncHandler(firebasePhoneVerifyController));

export default router;

