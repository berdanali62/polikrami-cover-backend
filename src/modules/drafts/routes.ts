// src/modules/drafts/routes.ts
import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateBody, validateParams } from '../../middlewares/validation';
import { z } from 'zod';
import {
  createDraftSchema,
  updateDraftSchema,
  setMessageCardSchema,
  setShippingSchema,
  setShippingAddressIdSchema,
  setBillingAddressSchema,
  presignUploadSchema,
  assignDesignerSchema,
  requestRevisionSchema,
  cancelDraftSchema
} from './dto/draft.dto';
import { DraftController } from './controller/draft.controller';
import {
  uploadMiddleware,
  attachRelativePath,
  validateMagicBytes,
  sanitizeImage
} from '../../shared/upload/multer';
import { ensureDraftOwner } from './middlewares/ensureDraftOwner';
import { ensureAssignedDesignerOrAdmin } from './middlewares/ensureAssignedDesignerOrAdmin';

const router = Router();
const controller = new DraftController();

// Validation schemas
const idParam = z.object({
  id: z.string().uuid({ message: 'Geçerli bir taslak ID (UUID) giriniz.' })
});

// Basic CRUD operations
router.post(
  '/',
  requireAuth,
  validateBody(createDraftSchema),
  asyncHandler(controller.create.bind(controller))
);

router.get(
  '/',
  requireAuth,
  asyncHandler(controller.list.bind(controller))
);

router.get(
  '/:id',
  requireAuth,
  validateParams(idParam),
  asyncHandler(controller.get.bind(controller))
);

router.put(
  '/:id',
  requireAuth,
  validateParams(idParam),
  validateBody(updateDraftSchema),
  asyncHandler(controller.update.bind(controller))
);

// Upload operations
router.post(
  '/:id/presign',
  requireAuth,
  validateParams(idParam),
  validateBody(presignUploadSchema),
  asyncHandler(controller.getUploadUrl.bind(controller))
);

router.post(
  '/:id/upload',
  requireAuth,
  validateParams(idParam),
  ensureDraftOwner,
  uploadMiddleware.single('file'),
  validateMagicBytes,
  sanitizeImage,
  attachRelativePath,
  asyncHandler(controller.uploadFile.bind(controller))
);

// Configuration operations
router.post(
  '/:id/message-card',
  requireAuth,
  validateParams(idParam),
  validateBody(setMessageCardSchema),
  asyncHandler(controller.setMessageCard.bind(controller))
);

router.post(
  '/:id/shipping',
  requireAuth,
  validateParams(idParam),
  validateBody(setShippingSchema),
  asyncHandler(controller.setShipping.bind(controller))
);

// Set shipping from a saved Address by ID (snapshot only)
router.post(
  '/:id/shipping/address',
  requireAuth,
  validateParams(idParam),
  validateBody(setShippingAddressIdSchema),
  asyncHandler(controller.setShippingFromAddress.bind(controller))
);

// Set ephemeral billing address (or same as shipping)
router.post(
  '/:id/billing',
  requireAuth,
  validateParams(idParam),
  validateBody(setBillingAddressSchema),
  asyncHandler(controller.setBillingAddress.bind(controller))
);

router.post(
  '/:id/assign-designer',
  requireAuth,
  validateParams(idParam),
  validateBody(assignDesignerSchema),
  asyncHandler(controller.assignDesigner.bind(controller))
);

// Commit operation
router.post(
  '/:id/commit',
  requireAuth,
  validateParams(idParam),
  asyncHandler(controller.commit.bind(controller))
);

// Workflow endpoints
router.post(
  '/:id/preview',
  requireAuth,
  validateParams(idParam),
  ensureAssignedDesignerOrAdmin,
  asyncHandler(controller.sendPreview.bind(controller))
);

router.post(
  '/:id/revision',
  requireAuth,
  validateParams(idParam),
  ensureDraftOwner,
  validateBody(requestRevisionSchema),
  asyncHandler(controller.requestRevision.bind(controller))
);

router.post(
  '/:id/approve',
  requireAuth,
  validateParams(idParam),
  ensureDraftOwner,
  asyncHandler(controller.approve.bind(controller))
);

router.post(
  '/:id/cancel',
  requireAuth,
  validateParams(idParam),
  ensureDraftOwner,
  validateBody(cancelDraftSchema),
  asyncHandler(controller.cancel.bind(controller))
);

// Additional information endpoints
router.get(
  '/:id/workflow-history',
  requireAuth,
  validateParams(idParam),
  asyncHandler(controller.getWorkflowHistory.bind(controller))
);

router.get(
  '/:id/revisions',
  requireAuth,
  validateParams(idParam),
  asyncHandler(controller.getRevisionDetails.bind(controller))
);

export default router;