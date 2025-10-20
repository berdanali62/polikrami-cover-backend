import { Request, Response } from 'express';
import { SearchService } from '../service/search.service';
import { searchQuerySchema, suggestionsQuerySchema } from '../dto/search.dto';

const searchService = new SearchService();

/**
 * Global search endpoint
 * GET /api/v1/search?q=kitap&type=all&page=1&limit=20
 */
export async function globalSearchController(req: Request, res: Response) {
  const params = searchQuerySchema.parse(req.query);
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
export async function searchSuggestionsController(req: Request, res: Response) {
  const params = suggestionsQuerySchema.parse(req.query);

  const suggestions = await searchService.getSuggestions(
    params.q,
    params.limit
  );

  res.status(200).json({ 
    query: params.q,
    suggestions 
  });
}