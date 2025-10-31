interface ListCommentsParams {
    projectId?: string;
    layerId?: string;
    status: 'open' | 'resolved' | 'all';
    page: number;
    limit: number;
    userId: string;
}
interface CreateCommentData {
    projectId: string;
    body: string;
    targetLayerId?: string;
    authorId: string;
    rating?: number;
}
interface UpdateCommentData {
    body?: string;
    status?: 'open' | 'resolved';
    rating?: number;
}
export declare class CommentService {
    /**
     * Check if user has access to project
     * Uses single optimized query with OR condition
     */
    canAccessProject(userId: string, projectId: string): Promise<boolean>;
    /**
     * Check if layer belongs to project
     * Optimized: Uses findFirst with nested where instead of includes
     */
    isLayerInProject(layerId: string, projectId: string): Promise<boolean>;
    /**
     * List comments with pagination and filters
     */
    listComments(params: ListCommentsParams): Promise<{
        comments: {
            project: {
                id: string;
                title: string;
            };
            layer: {
                id: string;
                type: string;
            } | null;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CommentStatus;
            rating: number | null;
            body: string;
            author: {
                email: string;
                name: string | null;
                id: string;
                avatarUrl: string | null;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get single comment by ID
     */
    getComment(id: string, userId: string): Promise<{
        project: {
            id: string;
            title: string;
        };
        layer: {
            id: string;
            type: string;
        } | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CommentStatus;
        rating: number | null;
        body: string;
        author: {
            email: string;
            name: string | null;
            id: string;
            avatarUrl: string | null;
        };
    }>;
    /**
     * Create new comment
     */
    createComment(data: CreateCommentData): Promise<{
        project: {
            id: string;
            title: string;
        };
        layer: {
            id: string;
            type: string;
        } | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CommentStatus;
        rating: number | null;
        body: string;
        author: {
            email: string;
            name: string | null;
            id: string;
            avatarUrl: string | null;
        };
    }>;
    /**
     * Check if user can modify comment
     * Returns comment data if authorized
     */
    canModifyComment(userId: string, commentId: string): Promise<{
        project: {
            ownerId: string;
        };
        id: string;
        authorId: string;
    }>;
    /**
     * Update comment
     */
    updateComment(id: string, userId: string, data: UpdateCommentData): Promise<{
        project: {
            id: string;
            title: string;
        };
        layer: {
            id: string;
            type: string;
        } | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CommentStatus;
        rating: number | null;
        body: string;
        author: {
            email: string;
            name: string | null;
            id: string;
            avatarUrl: string | null;
        };
    }>;
    /**
     * Delete comment
     */
    deleteComment(id: string, userId: string): Promise<void>;
    /**
     * Get comment statistics for a project
     * Useful for dashboards
     */
    getProjectStats(projectId: string, userId: string): Promise<{
        total: number;
        open: number;
        resolved: number;
    }>;
}
export {};
