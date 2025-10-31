"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const zod_1 = require("zod");
const notification_controller_1 = require("./controller/notification.controller");
const router = (0, express_1.Router)();
// Parameter validation
const notificationIdParam = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir bildirim ID (UUID) giriniz.' })
});
// All routes require authentication
router.get('/', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(notification_controller_1.listMyNotificationsController));
router.put('/:id/read', auth_1.requireAuth, (0, validation_1.validateParams)(notificationIdParam), (0, asyncHandler_1.asyncHandler)(notification_controller_1.markNotificationAsReadController));
router.put('/mark-all-read', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(notification_controller_1.markAllAsReadController));
router.delete('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(notificationIdParam), (0, asyncHandler_1.asyncHandler)(notification_controller_1.deleteNotificationController));
exports.default = router;
