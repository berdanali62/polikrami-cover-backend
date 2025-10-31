import { Router } from 'express';
import { validateBody } from '../../middlewares/validation';
import { registerSchema } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import { loginController, logoutController, refreshController, registerController, forgotPasswordController, resetPasswordController, verifyResetCodeController, resendVerificationController, verifyEmailController } from './controller/auth.controller';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { forgotPasswordSchema, resetPasswordSchema, verifyResetCodeSchema } from './dto/forgot-password.dto';
import { resendVerificationSchema, verifyEmailSchema } from './dto/verify-email.dto';
import { checkAccountLock } from '../../middlewares/accountLock';
import { emailVerificationRateLimit } from '../../middlewares/emailVerificationRateLimit';
import { passwordResetRateLimit } from '../../middlewares/passwordResetRateLimit';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(registerController));
router.post('/login', validateBody(loginSchema), checkAccountLock, asyncHandler(loginController));
router.post('/refresh', asyncHandler(refreshController));
router.post('/logout', asyncHandler(logoutController));
router.post('/forgot-password', validateBody(forgotPasswordSchema), passwordResetRateLimit, asyncHandler(forgotPasswordController));
router.post('/verify-reset-code', validateBody(verifyResetCodeSchema), asyncHandler(verifyResetCodeController));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(resetPasswordController));
router.post('/resend-verification', validateBody(resendVerificationSchema), emailVerificationRateLimit, asyncHandler(resendVerificationController));
router.post('/verify-email', validateBody(verifyEmailSchema), asyncHandler(verifyEmailController));

export default router;

