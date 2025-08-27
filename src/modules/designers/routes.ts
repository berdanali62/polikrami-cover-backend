import { Router } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { requireAuth } from '../../middlewares/auth';
import { listDesignersController } from './controller/designers.controller';

const router = Router();

router.get('/', requireAuth, asyncHandler(listDesignersController));

export default router;


