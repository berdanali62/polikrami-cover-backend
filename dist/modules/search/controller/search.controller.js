"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearchController = globalSearchController;
exports.searchSuggestionsController = searchSuggestionsController;
const search_service_1 = require("../service/search.service");
const search_dto_1 = require("../dto/search.dto");
const searchService = new search_service_1.SearchService();
/**
 * Global search endpoint
 * GET /api/v1/search?q=kitap&type=all&page=1&limit=20
 */
async function globalSearchController(req, res) {
    const params = search_dto_1.searchQuerySchema.parse(req.query);
    const userId = req.user?.id; // Optional: for private project search
    const results = await searchService.search({
        query: params.q,
        type: params.type,
        category: params.category,
        tag: params.tag,
        limit: params.limit,
        page: params.page,
        userId
    });
    // Log search for analytics (async, don't block response)
    void searchService.logSearch({
        query: params.q,
        type: params.type,
        userId,
        resultsCount: results.pagination.total
    });
    res.status(200).json(results);
}
/**
 * Search suggestions (autocomplete)
 * GET /api/v1/search/suggestions?q=kit
 */
async function searchSuggestionsController(req, res) {
    const params = search_dto_1.suggestionsQuerySchema.parse(req.query);
    const suggestions = await searchService.getSuggestions(params.q, params.limit);
    res.status(200).json({
        query: params.q,
        suggestions
    });
}
