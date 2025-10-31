"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const comment_controller_1 = require("./controller/comment.controller");
const comment_dto_1 = require("./dto/comment.dto");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.requireAuth);
/**
 * @route   GET /api/v1/comments
 * @desc    List comments with filters (projectId, layerId, status)
 * @access  Private (requires project access)
 * @query   projectId?, layerId?, status?, page?, limit?
 */
router.get('/', (0, validation_1.validateQuery)(comment_dto_1.listCommentsSchema), (0, asyncHandler_1.asyncHandler)(comment_controller_1.listCommentsController));
/**
 * @route   GET /api/v1/comments/projects/:projectId/stats
 * @desc    Get comment statistics for a project
 * @access  Private (requires project access)
 * @returns { total: number, open: number, resolved: number }
 */
router.get('/projects/:projectId/stats', (0, validation_1.validateParams)(comment_dto_1.projectIdParamSchema), (0, asyncHandler_1.asyncHandler)(comment_controller_1.getProjectStatsController));
/**
 * @route   GET /api/v1/comments/:id
 * @desc    Get single comment by ID
 * @access  Private (requires project access)
 */
router.get('/:id', (0, validation_1.validateParams)(comment_dto_1.commentIdParamSchema), (0, asyncHandler_1.asyncHandler)(comment_controller_1.getCommentController));
/**
 * @route   POST /api/v1/comments
 * @desc    Create new comment on a project/layer
 * @access  Private (requires project membership)
 * @body    { projectId, body, targetLayerId?, rating? }
 */
router.post('/', (0, validation_1.validateBody)(comment_dto_1.createCommentSchema), (0, asyncHandler_1.asyncHandler)(comment_controller_1.createCommentController));
/**
 * @route   PUT /api/v1/comments/:id
 * @desc    Update comment (author or project owner only)
 * @access  Private (requires ownership)
 * @body    { body?, status?, rating? }
 */
router.put('/:id', (0, validation_1.validateParams)(comment_dto_1.commentIdParamSchema), (0, validation_1.validateBody)(comment_dto_1.updateCommentSchema), (0, asyncHandler_1.asyncHandler)(comment_controller_1.updateCommentController));
/**
 * @route   DELETE /api/v1/comments/:id
 * @desc    Delete comment (author or project owner only)
 * @access  Private (requires ownership)
 */
router.delete('/:id', (0, validation_1.validateParams)(comment_dto_1.commentIdParamSchema), (0, asyncHandler_1.asyncHandler)(comment_controller_1.deleteCommentController));
exports.default = router;
