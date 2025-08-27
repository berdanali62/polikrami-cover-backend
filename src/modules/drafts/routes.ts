import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateBody, validateParams } from '../../middlewares/validation';
import { z } from 'zod';
import { createDraftSchema, updateDraftSchema, setMessageCardSchema, setShippingSchema, presignUploadSchema } from './dto/draft.dto';
import { createDraftController, getMyDraftsController, getDraftController, updateDraftController, uploadPresignController, setMessageCardController, setShippingController, commitDraftController, uploadFileController, assignDesignerController } from './controller/draft.controller';
import { uploadMiddleware, attachRelativePath, validateMagicBytes } from '../../shared/upload/multer';

const router = Router();
const idParam = z.object({ id: z.string().uuid({ message: 'Geçerli bir taslak ID (UUID) giriniz.' }) });

router.post('/', requireAuth, validateBody(createDraftSchema), asyncHandler(createDraftController));
router.get('/', requireAuth, asyncHandler(getMyDraftsController));
router.get('/:id', requireAuth, validateParams(idParam), asyncHandler(getDraftController));
router.put('/:id', requireAuth, validateParams(idParam), validateBody(updateDraftSchema), asyncHandler(updateDraftController));
router.post('/:id/presign', requireAuth, validateParams(idParam), validateBody(presignUploadSchema), asyncHandler(uploadPresignController));
router.post(
  '/:id/upload',
  requireAuth,
  validateParams(idParam),
  uploadMiddleware.single('file'),
  validateMagicBytes,
  attachRelativePath,
  asyncHandler(uploadFileController)
);
router.post('/:id/message-card', requireAuth, validateParams(idParam), validateBody(setMessageCardSchema), asyncHandler(setMessageCardController));
router.post('/:id/shipping', requireAuth, validateParams(idParam), validateBody(setShippingSchema), asyncHandler(setShippingController));
router.post('/:id/commit', requireAuth, validateParams(idParam), asyncHandler(commitDraftController));
router.post('/:id/assign-designer', requireAuth, validateParams(idParam), asyncHandler(assignDesignerController));

export default router;


