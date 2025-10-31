interface SearchParams {
    query: string;
    type: 'all' | 'templates' | 'projects' | 'designers';
    category?: string;
    tag?: string;
    limit: number;
    page: number;
    userId?: string;
}
interface SearchResult {
    query: string;
    type: string;
    results: {
        templates?: any[];
        designers?: any[];
        projects?: any[];
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
export declare class SearchService {
    /**
     * Global search with full-text support
     */
    search(params: SearchParams): Promise<SearchResult>;
    /**
     * Search templates with optimized query
     */
    private searchTemplates;
    /**
     * Search designers (public profiles only)
     */
    private searchDesigners;
    private searchProjects;
    /**
     * Get search suggestions (autocomplete)
     */
    getSuggestions(query: string, limit?: number): Promise<{
        type: string;
        text: string;
        value: string;
        icon: string;
    }[]>;
    /**
     * Get popular suggestions (trending)
     */
    private getPopularSuggestions;
    /**
     * Sanitize search query
     */
    private sanitizeQuery;
    /**
     * Log search analytics
     */
    logSearch(params: {
        query: string;
        type: string;
        userId?: string;
        resultsCount: number;
    }): Promise<void>;
}
export {};
