import { Router, type RequestHandler } from 'express';
import { validateBody, validateQuery } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { requireRole } from '../../middlewares/auth';
import { contactSchema } from './dto/contact.dto';
import { 
  contactController, 
  getSubmissionsController,
  updateSubmissionController 
} from './controller/contact.controller';
import { contactRateLimit } from './middlewares/contactRateLimit';
import { z } from 'zod';

const router = Router();

// Admin middleware
const adminMw: RequestHandler = (req, res, next) => {
  void requireRole('admin')(req, res, next);
};

/**
 * @route   POST /api/v1/contact
 * @desc    Submit contact form
 * @access  Public (rate limited)
 * @rateLimit 3 requests per 10 minutes per IP
 */
router.post(
  '/',
  contactRateLimit,
  validateBody(contactSchema),
  asyncHandler(contactController)
);

/**
 * @route   GET /api/v1/contact/submissions
 * @desc    Get all contact submissions (admin only)
 * @access  Admin
 */
router.get(
  '/submissions',
  adminMw,
  validateQuery(z.object({
    status: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20)
  })),
  asyncHandler(getSubmissionsController)
);

/**
 * @route   PATCH /api/v1/contact/submissions/:id
 * @desc    Update submission status (admin only)
 * @access  Admin
 */
router.patch(
  '/submissions/:id',
  adminMw,
  validateBody(z.object({
    status: z.enum(['pending', 'read', 'replied', 'spam', 'archived']),
    notes: z.string().optional()
  })),
  asyncHandler(updateSubmissionController)
);

export default router;