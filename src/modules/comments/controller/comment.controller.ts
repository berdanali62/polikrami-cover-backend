import { Request, Response } from 'express';
import { CommentService } from '../service/comment.service';
import { 
  createCommentSchema, 
  updateCommentSchema, 
  listCommentsSchema 
} from '../dto/comment.dto';

const commentService = new CommentService();

/**
 * List comments with filters and pagination
 * GET /api/v1/comments?projectId=xxx&status=open&page=1&limit=20
 */
export async function listCommentsController(req: Request, res: Response) {
  const params = listCommentsSchema.parse(req.query);
  const userId = req.user!.id;

  const result = await commentService.listComments({
    ...params,
    userId
  });

  res.status(200).json(result);
}

/**
 * Get single comment by ID
 * GET /api/v1/comments/:id
 */
export async function getCommentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const comment = await commentService.getComment(id, userId);

  res.status(200).json(comment);
}

/**
 * Create new comment
 * POST /api/v1/comments
 */
export async function createCommentController(req: Request, res: Response) {
  const data = createCommentSchema.parse(req.body);
  const authorId = req.user!.id;

  const comment = await commentService.createComment({
    ...data,
    authorId
  });

  res.status(201).json(comment);
}

/**
 * Update comment
 * PUT /api/v1/comments/:id
 */
export async function updateCommentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = updateCommentSchema.parse(req.body);
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const updated = await commentService.updateComment(id, userId, data);

  res.status(200).json(updated);
}

/**
 * Delete comment
 * DELETE /api/v1/comments/:id
 */
export async function deleteCommentController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  await commentService.deleteComment(id, userId);

  res.status(204).send();
}

/**
 * Get comment statistics for a project
 * GET /api/v1/comments/projects/:projectId/stats
 */
export async function getProjectStatsController(req: Request, res: Response) {
  const { projectId } = req.params as { projectId: string };
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const stats = await commentService.getProjectStats(projectId, userId);

  res.status(200).json(stats);
}