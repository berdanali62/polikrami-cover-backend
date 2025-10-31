"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const zod_1 = require("zod");
const category_controller_1 = require("./controller/category.controller");
const category_dto_1 = require("./dto/category.dto");
const router = (0, express_1.Router)();
// Parameter validation
const categoryIdParam = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, { message: 'Geçerli bir kategori ID (sayı) giriniz.' })
});
// Public routes
router.get('/', (0, asyncHandler_1.asyncHandler)(category_controller_1.listCategoriesController));
router.get('/:id', (0, validation_1.validateParams)(categoryIdParam), (0, asyncHandler_1.asyncHandler)(category_controller_1.getCategoryController));
// Protected routes (admin only)
router.post('/', (0, auth_1.requireRole)('admin'), (0, validation_1.validateBody)(category_dto_1.createCategorySchema), (0, asyncHandler_1.asyncHandler)(category_controller_1.createCategoryController));
router.put('/:id', (0, auth_1.requireRole)('admin'), (0, validation_1.validateParams)(categoryIdParam), (0, validation_1.validateBody)(category_dto_1.updateCategorySchema), (0, asyncHandler_1.asyncHandler)(category_controller_1.updateCategoryController));
router.delete('/:id', (0, auth_1.requireRole)('admin'), (0, validation_1.validateParams)(categoryIdParam), (0, asyncHandler_1.asyncHandler)(category_controller_1.deleteCategoryController));
exports.default = router;
