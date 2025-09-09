import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { getBalanceController, getHistoryController, grantCreditsController, purchaseCreditsController } from './controller/wallet.controller';
import { validateBody } from '../../middlewares/validation';
import { grantSchema, purchaseSchema } from './dto/wallet.dto';

const router = Router();

router.get('/', requireAuth, asyncHandler(getBalanceController));
router.get('/history', requireAuth, asyncHandler(getHistoryController));
router.post('/grant', requireRole('admin'), validateBody(grantSchema), asyncHandler(grantCreditsController));
router.post('/purchase', requireAuth, validateBody(purchaseSchema), asyncHandler(purchaseCreditsController));

export default router;


