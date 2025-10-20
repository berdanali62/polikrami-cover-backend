import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody, validateParams } from '../../middlewares/validation';
import { createReturnController, listMyReturnsController, updateReturnStatusController } from './controller/returns.controller';
import { createReturnSchema, returnParamSchema, updateReturnStatusSchema } from './dto/returns.dto';

const router = Router();
const authMw: RequestHandler = (req, res, next) => { void requireAuth(req, res, next); };
const adminMw: RequestHandler = (req, res, next) => { void requireRole('admin')(req, res, next); };

router.get('/', authMw, asyncHandler(listMyReturnsController));
router.post('/', authMw, validateBody(createReturnSchema), asyncHandler(createReturnController));
router.put('/:id/status', adminMw, validateParams(returnParamSchema), validateBody(updateReturnStatusSchema), asyncHandler(updateReturnStatusController));

export default router;


