import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateParams, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  listMyNotificationsController,
  markNotificationAsReadController,
  markAllAsReadController,
  deleteNotificationController
} from './controller/notification.controller';

const router = Router();

// Parameter validation
const notificationIdParam = z.object({
  id: z.string().uuid({ message: 'Geçerli bir bildirim ID (UUID) giriniz.' })
});

// All routes require authentication
router.get('/', requireAuth, asyncHandler(listMyNotificationsController));
router.put('/:id/read', requireAuth, validateParams(notificationIdParam), asyncHandler(markNotificationAsReadController));
router.put('/mark-all-read', requireAuth, asyncHandler(markAllAsReadController));
router.delete('/:id', requireAuth, validateParams(notificationIdParam), asyncHandler(deleteNotificationController));

export default router;
