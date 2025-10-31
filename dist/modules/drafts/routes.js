"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/drafts/routes.ts
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const validation_1 = require("../../middlewares/validation");
const zod_1 = require("zod");
const draft_dto_1 = require("./dto/draft.dto");
const draft_controller_1 = require("./controller/draft.controller");
const multer_1 = require("../../shared/upload/multer");
const ensureDraftOwner_1 = require("./middlewares/ensureDraftOwner");
const ensureAssignedDesignerOrAdmin_1 = require("./middlewares/ensureAssignedDesignerOrAdmin");
const router = (0, express_1.Router)();
const controller = new draft_controller_1.DraftController();
// Validation schemas
const idParam = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir taslak ID (UUID) giriniz.' })
});
// Basic CRUD operations
router.post('/', auth_1.requireAuth, (0, validation_1.validateBody)(draft_dto_1.createDraftSchema), (0, asyncHandler_1.asyncHandler)(controller.create.bind(controller)));
router.get('/', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(controller.list.bind(controller)));
router.get('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, asyncHandler_1.asyncHandler)(controller.get.bind(controller)));
router.put('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.updateDraftSchema), (0, asyncHandler_1.asyncHandler)(controller.update.bind(controller)));
// Upload operations
router.post('/:id/presign', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.presignUploadSchema), (0, asyncHandler_1.asyncHandler)(controller.getUploadUrl.bind(controller)));
router.post('/:id/upload', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), ensureDraftOwner_1.ensureDraftOwner, multer_1.uploadMiddleware.single('file'), multer_1.validateMagicBytes, multer_1.sanitizeImage, multer_1.attachRelativePath, (0, asyncHandler_1.asyncHandler)(controller.uploadFile.bind(controller)));
// Configuration operations
router.post('/:id/message-card', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.setMessageCardSchema), (0, asyncHandler_1.asyncHandler)(controller.setMessageCard.bind(controller)));
router.post('/:id/shipping', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.setShippingSchema), (0, asyncHandler_1.asyncHandler)(controller.setShipping.bind(controller)));
// Set shipping from a saved Address by ID (snapshot only)
router.post('/:id/shipping/address', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.setShippingAddressIdSchema), (0, asyncHandler_1.asyncHandler)(controller.setShippingFromAddress.bind(controller)));
// Set ephemeral billing address (or same as shipping)
router.post('/:id/billing', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.setBillingAddressSchema), (0, asyncHandler_1.asyncHandler)(controller.setBillingAddress.bind(controller)));
router.post('/:id/assign-designer', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(draft_dto_1.assignDesignerSchema), (0, asyncHandler_1.asyncHandler)(controller.assignDesigner.bind(controller)));
// Commit operation
router.post('/:id/commit', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, asyncHandler_1.asyncHandler)(controller.commit.bind(controller)));
// Workflow endpoints
router.post('/:id/preview', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), ensureAssignedDesignerOrAdmin_1.ensureAssignedDesignerOrAdmin, (0, asyncHandler_1.asyncHandler)(controller.sendPreview.bind(controller)));
router.post('/:id/revision', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), ensureDraftOwner_1.ensureDraftOwner, (0, validation_1.validateBody)(draft_dto_1.requestRevisionSchema), (0, asyncHandler_1.asyncHandler)(controller.requestRevision.bind(controller)));
router.post('/:id/approve', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), ensureDraftOwner_1.ensureDraftOwner, (0, asyncHandler_1.asyncHandler)(controller.approve.bind(controller)));
router.post('/:id/cancel', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), ensureDraftOwner_1.ensureDraftOwner, (0, validation_1.validateBody)(draft_dto_1.cancelDraftSchema), (0, asyncHandler_1.asyncHandler)(controller.cancel.bind(controller)));
// Additional information endpoints
router.get('/:id/workflow-history', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, asyncHandler_1.asyncHandler)(controller.getWorkflowHistory.bind(controller)));
router.get('/:id/revisions', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, asyncHandler_1.asyncHandler)(controller.getRevisionDetails.bind(controller)));
exports.default = router;
