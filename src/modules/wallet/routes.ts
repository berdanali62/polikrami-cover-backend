import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import {
  getBalanceController,
  getHistoryController,
  getStatsController,
  grantCreditsController,
  purchaseCreditsController
} from './controller/wallet.controller';
import { validateBody, validateQuery } from '../../middlewares/validation';
import { grantSchema, purchaseSchema, historyQuerySchema } from './dto/wallet.dto';
import { walletRateLimit } from './middlewares/walletRateLimit';

const router = Router();

// Middleware wrappers
const authMw: RequestHandler = (req, res, next) => {
  void requireAuth(req, res, next);
};

const adminMw: RequestHandler = (req, res, next) => {
  void requireRole('admin')(req, res, next);
};

/**
 * @route   GET /api/v1/wallet
 * @desc    Get current credit balance
 * @access  Private
 */
router.get(
  '/',
  authMw,
  asyncHandler(getBalanceController)
);

/**
 * @route   GET /api/v1/wallet/history
 * @desc    Get transaction history
 * @access  Private
 * @query   page, limit, type
 */
router.get(
  '/history',
  authMw,
  validateQuery(historyQuerySchema),
  asyncHandler(getHistoryController)
);

/**
 * @route   GET /api/v1/wallet/stats
 * @desc    Get wallet statistics
 * @access  Private
 */
router.get(
  '/stats',
  authMw,
  asyncHandler(getStatsController)
);

/**
 * @route   POST /api/v1/wallet/grant
 * @desc    Admin grant credits to user
 * @access  Admin only
 */
router.post(
  '/grant',
  adminMw,
  validateBody(grantSchema),
  asyncHandler(grantCreditsController)
);

/**
 * @route   POST /api/v1/wallet/purchase
 * @desc    Purchase credit package
 * @access  Private (rate limited)
 * @rateLimit 5 purchases per hour
 */
router.post(
  '/purchase',
  authMw,
  walletRateLimit,
  validateBody(purchaseSchema),
  asyncHandler(purchaseCreditsController)
);

export default router;