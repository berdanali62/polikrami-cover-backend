"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const auth_1 = require("../../middlewares/auth");
const designers_controller_1 = require("./controller/designers.controller");
const public_controller_1 = require("./controller/public.controller");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(designers_controller_1.listDesignersController));
router.get('/recommended', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(designers_controller_1.recommendedDesignersController));
router.get('/sorted', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(designers_controller_1.listDesignersSortedController));
router.post('/:id/reviews', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(designers_controller_1.createReviewController));
router.get('/:id/reviews', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(designers_controller_1.listReviewsController));
// Public endpoints
router.get('/public/:id', (0, asyncHandler_1.asyncHandler)(public_controller_1.publicProfileController));
router.get('/public', (0, asyncHandler_1.asyncHandler)(public_controller_1.searchDesignersController));
exports.default = router;
