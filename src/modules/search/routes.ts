import { Router } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { globalSearchController, searchSuggestionsController } from './controller/search.controller';

const router = Router();

// Public search endpoints
router.get('/', asyncHandler(globalSearchController));
router.get('/suggestions', asyncHandler(searchSuggestionsController));

export default router;
