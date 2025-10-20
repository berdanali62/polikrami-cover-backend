import { Router } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateQuery } from '../../middlewares/validation';
import { 
  globalSearchController, 
  searchSuggestionsController 
} from './controller/search.controller';
import { 
  searchQuerySchema, 
  suggestionsQuerySchema 
} from './dto/search.dto';
import { searchRateLimit } from './middlewares/searchRateLimit'

const router = Router();

/**
 * @route   GET /api/v1/search
 * @desc    Global search across templates, designers, projects
 * @access  Public (projects require auth)
 * @query   q, type, category, tag, page, limit
 * @rateLimit 30 requests per minute
 */
router.get(
  '/',
  searchRateLimit,
  validateQuery(searchQuerySchema),
  asyncHandler(globalSearchController)
);

/**
 * @route   GET /api/v1/search/suggestions
 * @desc    Get search autocomplete suggestions
 * @access  Public
 * @query   q, limit
 * @rateLimit 60 requests per minute
 */
router.get(
  '/suggestions',
  searchRateLimit,
  validateQuery(suggestionsQuerySchema),
  asyncHandler(searchSuggestionsController)
);

export default router;




























































