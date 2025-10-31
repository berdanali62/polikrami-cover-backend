"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommentsController = listCommentsController;
exports.getCommentController = getCommentController;
exports.createCommentController = createCommentController;
exports.updateCommentController = updateCommentController;
exports.deleteCommentController = deleteCommentController;
exports.getProjectStatsController = getProjectStatsController;
const comment_service_1 = require("../service/comment.service");
const comment_dto_1 = require("../dto/comment.dto");
const commentService = new comment_service_1.CommentService();
/**
 * List comments with filters and pagination
 * GET /api/v1/comments?projectId=xxx&status=open&page=1&limit=20
 */
async function listCommentsController(req, res) {
    const params = comment_dto_1.listCommentsSchema.parse(req.query);
    const userId = req.user.id;
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
async function getCommentController(req, res) {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    const comment = await commentService.getComment(id, userId);
    res.status(200).json(comment);
}
/**
 * Create new comment
 * POST /api/v1/comments
 */
async function createCommentController(req, res) {
    const data = comment_dto_1.createCommentSchema.parse(req.body);
    const authorId = req.user.id;
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
async function updateCommentController(req, res) {
    const { id } = req.params;
    const data = comment_dto_1.updateCommentSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    const updated = await commentService.updateComment(id, userId, data);
    res.status(200).json(updated);
}
/**
 * Delete comment
 * DELETE /api/v1/comments/:id
 */
async function deleteCommentController(req, res) {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    await commentService.deleteComment(id, userId);
    res.status(204).send();
}
/**
 * Get comment statistics for a project
 * GET /api/v1/comments/projects/:projectId/stats
 */
async function getProjectStatsController(req, res) {
    const { projectId } = req.params;
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    const stats = await commentService.getProjectStats(projectId, userId);
    res.status(200).json(stats);
}
