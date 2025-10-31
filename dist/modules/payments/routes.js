"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const zod_1 = require("zod");
const payment_controller_1 = require("./controller/payment.controller");
const payment_dto_1 = require("./dto/payment.dto");
const webhookSignature_1 = require("./middlewares/webhookSignature");
const router = (0, express_1.Router)();
// Payment ID parameter validation
const paymentIdParam = zod_1.z.object({
    paymentId: zod_1.z.string().uuid({ message: 'Geçerli bir ödeme ID (UUID) giriniz.' })
});
// Protected routes (require authentication)
router.post('/initiate', auth_1.requireAuth, (0, validation_1.validateBody)(payment_dto_1.initiatePaymentSchema), (0, asyncHandler_1.asyncHandler)(payment_controller_1.initiatePaymentController));
router.post('/credit-card', auth_1.requireAuth, (0, validation_1.validateBody)(payment_dto_1.creditCardPaymentSchema), (0, asyncHandler_1.asyncHandler)(payment_controller_1.initiateCreditCardPaymentController));
router.get('/:paymentId/status', auth_1.requireAuth, (0, validation_1.validateParams)(paymentIdParam), (0, asyncHandler_1.asyncHandler)(payment_controller_1.getPaymentStatusController));
router.post('/refund', auth_1.requireAuth, (0, validation_1.validateBody)(payment_dto_1.refundPaymentSchema), (0, asyncHandler_1.asyncHandler)(payment_controller_1.refundPaymentController));
// Public callback endpoint (called by payment providers)
// ⚠️ CRITICAL: Webhook signature verification added for security
router.post('/callback', webhookSignature_1.verifyPaymentWebhook, (0, validation_1.validateBody)(payment_dto_1.paymentCallbackSchema), (0, asyncHandler_1.asyncHandler)(payment_controller_1.paymentCallbackController));
// Mock payment endpoints for testing (only in development)
router.get('/mock/success', (0, asyncHandler_1.asyncHandler)(payment_controller_1.mockPaymentSuccessController));
router.get('/mock/failure', (0, asyncHandler_1.asyncHandler)(payment_controller_1.mockPaymentFailureController));
exports.default = router;
