import { Router } from 'express';
import { validateBody } from '../../middlewares/validation';
import { registerSchema } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import { loginController, logoutController, refreshController, registerController, forgotPasswordController, resetPasswordController, verifyResetCodeController } from './controller/auth.controller';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { forgotPasswordSchema, resetPasswordSchema, verifyResetCodeSchema } from './dto/forgot-password.dto';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(registerController));
router.post('/login', validateBody(loginSchema), asyncHandler(loginController));
router.post('/refresh', asyncHandler(refreshController));
router.post('/logout', asyncHandler(logoutController));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgotPasswordController));
router.post('/verify-reset-code', validateBody(verifyResetCodeSchema), asyncHandler(verifyResetCodeController));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(resetPasswordController));

export default router;

