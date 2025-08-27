import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { listMyOrdersController, getOrderController, updateOrderStatusTestController, cancelOrderController } from './controller/order.controller';
import { validateParams, validateBody } from '../../middlewares/validation';
import { z } from 'zod';
import { updateOrderStatusSchema } from './dto/order.dto';

const router = Router();

const idParam = z.object({ id: z.string().uuid({ message: 'Geçerli bir sipariş ID (UUID) giriniz.' }) });

router.get('/', requireAuth, asyncHandler(listMyOrdersController));
router.get('/:id', requireAuth, validateParams(idParam), asyncHandler(getOrderController));
// Test amacıyla manuel durum güncelleme
router.post('/:id/status', requireAuth, validateParams(idParam), validateBody(updateOrderStatusSchema), asyncHandler(updateOrderStatusTestController));
// Sipariş iptali
router.post('/:id/cancel', requireAuth, validateParams(idParam), asyncHandler(cancelOrderController));

export default router;


