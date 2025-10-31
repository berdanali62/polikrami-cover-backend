"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const zod_1 = require("zod");
const asset_controller_1 = require("./controller/asset.controller");
const router = (0, express_1.Router)();
// Parameter validation
const assetIdParam = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir asset ID (UUID) giriniz.' })
});
// All routes require authentication
router.get('/', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(asset_controller_1.listMyAssetsController));
router.get('/stats', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(asset_controller_1.getStorageStatsController));
router.get('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(assetIdParam), (0, asyncHandler_1.asyncHandler)(asset_controller_1.getAssetController));
router.delete('/:id', auth_1.requireAuth, (0, validation_1.validateParams)(assetIdParam), (0, asyncHandler_1.asyncHandler)(asset_controller_1.deleteAssetController));
exports.default = router;
