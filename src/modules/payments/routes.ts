import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validateBody, validateParams } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { z } from 'zod';
import {
  initiatePaymentController,
  initiateCreditCardPaymentController,
  paymentCallbackController,
  getPaymentStatusController,
  refundPaymentController,
  mockPaymentSuccessController,
  mockPaymentFailureController
} from './controller/payment.controller';

import {
  initiatePaymentSchema,
  creditCardPaymentSchema,
  paymentCallbackSchema,
  refundPaymentSchema
} from './dto/payment.dto';
import { verifyPaymentWebhook } from './middlewares/webhookSignature';

const router = Router();

// Payment ID parameter validation
const paymentIdParam = z.object({
  paymentId: z.string().uuid({ message: 'Geçerli bir ödeme ID (UUID) giriniz.' })
});



// Protected routes (require authentication)
router.post('/initiate', requireAuth, validateBody(initiatePaymentSchema), asyncHandler(initiatePaymentController));
router.post('/credit-card', requireAuth, validateBody(creditCardPaymentSchema), asyncHandler(initiateCreditCardPaymentController));
router.get('/:paymentId/status', requireAuth, validateParams(paymentIdParam), asyncHandler(getPaymentStatusController));
router.post('/refund', requireAuth, validateBody(refundPaymentSchema), asyncHandler(refundPaymentController));

// Public callback endpoint (called by payment providers)
// ⚠️ CRITICAL: Webhook signature verification added for security
router.post('/callback', verifyPaymentWebhook, validateBody(paymentCallbackSchema), asyncHandler(paymentCallbackController));

// Mock payment endpoints for testing (only in development)
router.get('/mock/success', asyncHandler(mockPaymentSuccessController));
router.get('/mock/failure', asyncHandler(mockPaymentFailureController));

export default router;
