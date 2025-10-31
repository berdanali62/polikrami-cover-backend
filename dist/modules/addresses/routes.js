"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const addresses_dto_1 = require("./dto/addresses.dto");
const addresses_controller_1 = require("./controller/addresses.controller");
const router = (0, express_1.Router)();
// Auth middleware wrapper
const authMw = (req, res, next) => {
    void (0, auth_1.requireAuth)(req, res, next);
};
/**
 * @route   GET /api/v1/addresses
 * @desc    List user addresses
 * @access  Private
 */
router.get('/', authMw, (0, asyncHandler_1.asyncHandler)(addresses_controller_1.listAddressesController));
/**
 * @route   GET /api/v1/addresses/default
 * @desc    Get default address
 * @access  Private
 */
router.get('/default', authMw, (0, asyncHandler_1.asyncHandler)(addresses_controller_1.getDefaultAddressController));
/**
 * @route   GET /api/v1/addresses/:id
 * @desc    Get single address
 * @access  Private
 */
router.get('/:id', authMw, (0, validation_1.validateParams)(addresses_dto_1.addressIdParamSchema), (0, asyncHandler_1.asyncHandler)(addresses_controller_1.getAddressController));
/**
 * @route   POST /api/v1/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post('/', authMw, (0, validation_1.validateBody)(addresses_dto_1.createAddressSchema), (0, asyncHandler_1.asyncHandler)(addresses_controller_1.createAddressController));
/**
 * @route   PUT /api/v1/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put('/:id', authMw, (0, validation_1.validateParams)(addresses_dto_1.addressIdParamSchema), (0, validation_1.validateBody)(addresses_dto_1.updateAddressSchema), (0, asyncHandler_1.asyncHandler)(addresses_controller_1.updateAddressController));
/**
 * @route   POST /api/v1/addresses/:id/default
 * @desc    Set address as default
 * @access  Private
 */
router.post('/:id/default', authMw, (0, validation_1.validateParams)(addresses_dto_1.addressIdParamSchema), (0, asyncHandler_1.asyncHandler)(addresses_controller_1.setDefaultAddressController));
/**
 * @route   DELETE /api/v1/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete('/:id', authMw, (0, validation_1.validateParams)(addresses_dto_1.addressIdParamSchema), (0, asyncHandler_1.asyncHandler)(addresses_controller_1.deleteAddressController));
exports.default = router;
