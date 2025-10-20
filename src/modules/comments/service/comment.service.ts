import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';
import { notFound, forbidden } from '../../../shared/errors/ApiError';

// DTO Types
interface ListCommentsParams {
  projectId?: string;
  layerId?: string;
  status: 'open' | 'resolved' | 'all';
  page: number;
  limit: number;
  userId: string; // For access control
}

interface CreateCommentData {
  projectId: string;
  body: string;
  targetLayerId?: string;
  authorId: string;
  rating?: number; // For UI star rating
}

interface UpdateCommentData {
  body?: string;
  status?: 'open' | 'resolved';
  rating?: number;
}

// Select template for consistent responses
const commentSelect = {
  id: true,
  body: true,
  status: true,
  rating: true,
  createdAt: true,
  author: {
    select: { 
      id: true, 
      name: true, 
      email: true, 
      avatarUrl: true 
    }
  },
  project: {
    select: { 
      id: true, 
      title: true 
    }
  },
  layer: {
    select: { 
      id: true, 
      type: true 
    }
  }
} as const;

export class CommentService {
  /**
   * Check if user has access to project
   * Uses single optimized query with OR condition
   */
  async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: { id: true }
    });

    return !!project;
  }

  /**
   * Check if layer belongs to project
   * Optimized: Uses findFirst with nested where instead of includes
   */
  async isLayerInProject(layerId: string, projectId: string): Promise<boolean> {
    const layer = await prisma.layer.findFirst({
      where: {
        id: layerId,
        page: {
          designVersion: {
            projectId
          }
        }
      },
      select: { id: true }
    });

    return !!layer;
  }

  /**
   * List comments with pagination and filters
   */
  async listComments(params: ListCommentsParams) {
    const { projectId, layerId, status, page, limit, userId } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CommentWhereInput = {};

    if (projectId) {
      // Verify access before querying
      const hasAccess = await this.canAccessProject(userId, projectId);
      if (!hasAccess) {
        throw forbidden('Access denied to project');
      }
      where.projectId = projectId;
    } else {
      // No project specified → restrict to projects user can access
      where.project = {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      };
    }

    if (layerId) {
      where.targetLayerId = layerId;
    }

    if (status !== 'all') {
      where.status = status;
    }

    // Parallel queries for performance
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        select: commentSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single comment by ID
   */
  async getComment(id: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: commentSelect
    });

    if (!comment) {
      throw notFound('Comment not found');
    }

    // Verify user has access to the project
    const hasAccess = await this.canAccessProject(userId, comment.project.id);
    if (!hasAccess) {
      throw forbidden('Access denied to this comment');
    }

    return comment;
  }

  /**
   * Create new comment
   */
  async createComment(data: CreateCommentData) {
    const { projectId, targetLayerId, authorId } = data;

    // Verify project access
    const hasAccess = await this.canAccessProject(authorId, projectId);
    if (!hasAccess) {
      throw forbidden('Access denied to project');
    }

    // Verify layer if specified
    if (targetLayerId) {
      const layerValid = await this.isLayerInProject(targetLayerId, projectId);
      if (!layerValid) {
        throw notFound('Invalid layer ID for this project');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        projectId,
        authorId,
        body: data.body,
        targetLayerId,
        ...(typeof data.rating !== 'undefined' ? { rating: data.rating } : {})
      },
      select: commentSelect
    });

    return comment;
  }

  /**
   * Check if user can modify comment
   * Returns comment data if authorized
   */
  async canModifyComment(userId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        project: {
          select: { ownerId: true }
        }
      }
    });

    if (!comment) {
      throw notFound('Comment not found');
    }

    const isAuthor = comment.authorId === userId;
    const isProjectOwner = comment.project.ownerId === userId;

    if (!isAuthor && !isProjectOwner) {
      throw forbidden('Not authorized to modify this comment');
    }

    return comment;
  }

  /**
   * Update comment
   */
  async updateComment(id: string, userId: string, data: UpdateCommentData) {
    // Check authorization
    await this.canModifyComment(userId, id);

    // Update comment
    const updateData: Prisma.CommentUpdateInput = {};
    if (typeof data.body !== 'undefined') updateData.body = data.body;
    if (typeof data.status !== 'undefined') updateData.status = data.status;
    if (typeof data.rating !== 'undefined') updateData.rating = data.rating;

    const updated = await prisma.comment.update({
      where: { id },
      data: updateData,
      select: commentSelect
    });

    return updated;
  }

  /**
   * Delete comment
   */
  async deleteComment(id: string, userId: string) {
    // Check authorization
    await this.canModifyComment(userId, id);

    // Delete comment
    await prisma.comment.delete({ where: { id } });
  }

  /**
   * Get comment statistics for a project
   * Useful for dashboards
   */
  async getProjectStats(projectId: string, userId: string) {
    const hasAccess = await this.canAccessProject(userId, projectId);
    if (!hasAccess) {
      throw forbidden('Access denied to project');
    }

    const [total, open, resolved] = await Promise.all([
      prisma.comment.count({ where: { projectId } }),
      prisma.comment.count({ where: { projectId, status: 'open' } }),
      prisma.comment.count({ where: { projectId, status: 'resolved' } })
    ]);

    return { total, open, resolved };
  }
}