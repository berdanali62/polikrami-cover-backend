import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { requireAuth } from '../../middlewares/auth';
import { validateBody, validateParams } from '../../middlewares/validation';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema
} from './dto/addresses.dto';
import {
  listAddressesController,
  getAddressController,
  createAddressController,
  updateAddressController,
  setDefaultAddressController,
  deleteAddressController,
  getDefaultAddressController
} from './controller/addresses.controller';

const router = Router();

// Auth middleware wrapper
const authMw: RequestHandler = (req, res, next) => {
  void requireAuth(req, res, next);
};

/**
 * @route   GET /api/v1/addresses
 * @desc    List user addresses
 * @access  Private
 */
router.get(
  '/',
  authMw,
  asyncHandler(listAddressesController)
);

/**
 * @route   GET /api/v1/addresses/default
 * @desc    Get default address
 * @access  Private
 */
router.get(
  '/default',
  authMw,
  asyncHandler(getDefaultAddressController)
);

/**
 * @route   GET /api/v1/addresses/:id
 * @desc    Get single address
 * @access  Private
 */
router.get(
  '/:id',
  authMw,
  validateParams(addressIdParamSchema),
  asyncHandler(getAddressController)
);

/**
 * @route   POST /api/v1/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post(
  '/',
  authMw,
  validateBody(createAddressSchema),
  asyncHandler(createAddressController)
);

/**
 * @route   PUT /api/v1/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put(
  '/:id',
  authMw,
  validateParams(addressIdParamSchema),
  validateBody(updateAddressSchema),
  asyncHandler(updateAddressController)
);

/**
 * @route   POST /api/v1/addresses/:id/default
 * @desc    Set address as default
 * @access  Private
 */
router.post(
  '/:id/default',
  authMw,
  validateParams(addressIdParamSchema),
  asyncHandler(setDefaultAddressController)
);

/**
 * @route   DELETE /api/v1/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete(
  '/:id',
  authMw,
  validateParams(addressIdParamSchema),
  asyncHandler(deleteAddressController)
);

export default router;