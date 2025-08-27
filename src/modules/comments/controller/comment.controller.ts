import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { createCommentSchema, updateCommentSchema, listCommentsSchema } from '../dto/comment.dto';
import { notFound, badRequest } from '../../../shared/errors/ApiError';
import { Prisma } from '@prisma/client';

export async function listCommentsController(req: Request, res: Response) {
  const params = listCommentsSchema.parse(req.query);
  const skip = (params.page - 1) * params.limit;
  
  const where: Prisma.CommentWhereInput = {};
  
  if (params.projectId) {
    where.projectId = params.projectId;
  }
  
  if (params.layerId) {
    where.targetLayerId = params.layerId;
  }
  
  if (params.status !== 'all') {
    where.status = params.status as 'open' | 'resolved';
  }
  
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        project: {
          select: { id: true, title: true }
        },
        layer: {
          select: { id: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit
    }),
    prisma.comment.count({ where })
  ]);
  
  res.status(200).json({
    comments,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit)
    }
  });
}

export async function getCommentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true }
      },
      project: {
        select: { id: true, title: true }
      },
      layer: {
        select: { id: true, type: true }
      }
    }
  });
  
  if (!comment) {
    throw notFound('Comment not found');
  }
  
  res.status(200).json(comment);
}

export async function createCommentController(req: Request, res: Response) {
  const data = createCommentSchema.parse(req.body);
  const authorId = req.user!.id;
  
  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: {
      members: { where: { userId: authorId } }
    }
  });
  
  if (!project) {
    throw notFound('Project not found');
  }
  
  // Check if user is owner or member
  const isOwner = project.ownerId === authorId;
  const isMember = project.members.length > 0;
  
  if (!isOwner && !isMember) {
    throw badRequest('Access denied to project');
  }
  
  // Verify layer exists if specified
  if (data.targetLayerId) {
    const layer = await prisma.layer.findUnique({
      where: { id: data.targetLayerId },
      include: { page: { include: { designVersion: true } } }
    });
    
    if (!layer || layer.page.designVersion.projectId !== data.projectId) {
      throw badRequest('Invalid layer ID for this project');
    }
  }
  
  const comment = await prisma.comment.create({
    data: {
      ...data,
      authorId
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true }
      }
    }
  });
  
  res.status(201).json(comment);
}

export async function updateCommentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = updateCommentSchema.parse(req.body);
  const userId = req.user!.id;
  
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { project: true }
  });
  
  if (!comment) {
    throw notFound('Comment not found');
  }
  
  // Only author or project owner can update
  const isAuthor = comment.authorId === userId;
  const isProjectOwner = comment.project.ownerId === userId;
  
  if (!isAuthor && !isProjectOwner) {
    throw badRequest('Not authorized to update this comment');
  }
  
  const updated = await prisma.comment.update({
    where: { id },
    data,
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true }
      }
    }
  });
  
  res.status(200).json(updated);
}

export async function deleteCommentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user!.id;
  
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { project: true }
  });
  
  if (!comment) {
    throw notFound('Comment not found');
  }
  
  // Only author or project owner can delete
  const isAuthor = comment.authorId === userId;
  const isProjectOwner = comment.project.ownerId === userId;
  
  if (!isAuthor && !isProjectOwner) {
    throw badRequest('Not authorized to delete this comment');
  }
  
  await prisma.comment.delete({ where: { id } });
  res.status(204).send();
}
