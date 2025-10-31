"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const zod_1 = require("zod");
const template_controller_1 = require("./controller/template.controller");
const template_dto_1 = require("./dto/template.dto");
const router = (0, express_1.Router)();
// Parameter validation schemas
const templateIdParam = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir şablon ID (UUID) giriniz.' })
});
const templateSlugParam = zod_1.z.object({
    slug: zod_1.z.string().min(1, { message: 'Geçerli bir şablon slug\'u giriniz.' })
});
// Public routes
router.get('/', (0, validation_1.validateQuery)(template_dto_1.listTemplatesSchema), (0, asyncHandler_1.asyncHandler)(template_controller_1.listTemplatesController));
router.get('/popular', (0, asyncHandler_1.asyncHandler)(template_controller_1.getPopularTemplatesController));
router.get('/slug/:slug', (0, validation_1.validateParams)(templateSlugParam), (0, asyncHandler_1.asyncHandler)(template_controller_1.getTemplateBySlugController));
router.get('/:id', (0, validation_1.validateParams)(templateIdParam), (0, asyncHandler_1.asyncHandler)(template_controller_1.getTemplateByIdController));
// Protected routes (admin/designer only) - Allow both admin and designer roles
router.post('/', auth_1.requireAuth, (0, validation_1.validateBody)(template_dto_1.createTemplateSchema), (0, asyncHandler_1.asyncHandler)(template_controller_1.createTemplateController));
router.put('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(templateIdParam), (0, validation_1.validateBody)(template_dto_1.updateTemplateSchema), (0, asyncHandler_1.asyncHandler)(template_controller_1.updateTemplateController));
router.delete('/:id', (0, auth_1.requireRole)('admin'), (0, validation_1.validateParams)(templateIdParam), (0, asyncHandler_1.asyncHandler)(template_controller_1.deleteTemplateController)); // Only admin can delete
exports.default = router;
