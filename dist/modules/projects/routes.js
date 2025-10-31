"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const project_dto_1 = require("./dto/project.dto");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const project_controller_1 = require("./controller/project.controller");
const zod_1 = require("zod");
const validation_2 = require("../../middlewares/validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid({ message: 'Geçerli bir proje ID (UUID) giriniz.' }) });
const memberParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir proje ID (UUID) giriniz.' }),
    userId: zod_1.z.string().uuid({ message: 'Geçerli bir kullanıcı ID (UUID) giriniz.' }),
});
router.get('/', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(project_controller_1.listProjectsController));
router.post('/', auth_1.requireAuth, (0, validation_1.validateBody)(project_dto_1.createProjectSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.createProjectController));
router.get('/:id', auth_1.requireAuth, (0, validation_2.validateParams)(idParamSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.getProjectController));
router.put('/:id', auth_1.requireAuth, (0, validation_2.validateParams)(idParamSchema), (0, validation_1.validateBody)(project_dto_1.updateProjectSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.updateProjectController));
router.delete('/:id', auth_1.requireAuth, (0, validation_2.validateParams)(idParamSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.deleteProjectController));
router.get('/:id/members', auth_1.requireAuth, (0, validation_2.validateParams)(idParamSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.listMembersController));
router.post('/:id/members', auth_1.requireAuth, (0, validation_2.validateParams)(idParamSchema), (0, validation_1.validateBody)(project_dto_1.addMemberSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.addMemberController));
router.delete('/:id/members/:userId', auth_1.requireAuth, (0, validation_2.validateParams)(memberParamsSchema), (0, asyncHandler_1.asyncHandler)(project_controller_1.removeMemberController));
exports.default = router;
