"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const validation_1 = require("../../middlewares/validation");
const search_controller_1 = require("./controller/search.controller");
const search_dto_1 = require("./dto/search.dto");
const searchRateLimit_1 = require("./middlewares/searchRateLimit");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/search
 * @desc    Global search across templates, designers, projects
 * @access  Public (projects require auth)
 * @query   q, type, category, tag, page, limit
 * @rateLimit 30 requests per minute
 */
router.get('/', searchRateLimit_1.searchRateLimit, (0, validation_1.validateQuery)(search_dto_1.searchQuerySchema), (0, asyncHandler_1.asyncHandler)(search_controller_1.globalSearchController));
/**
 * @route   GET /api/v1/search/suggestions
 * @desc    Get search autocomplete suggestions
 * @access  Public
 * @query   q, limit
 * @rateLimit 60 requests per minute
 */
router.get('/suggestions', searchRateLimit_1.searchRateLimit, (0, validation_1.validateQuery)(search_dto_1.suggestionsQuerySchema), (0, asyncHandler_1.asyncHandler)(search_controller_1.searchSuggestionsController));
exports.default = router;
