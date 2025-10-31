"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const ApiError_1 = require("../../../shared/errors/ApiError");
const projectRepo_1 = require("../repository/projectRepo");
class ProjectService {
    async list(userId) {
        return (0, projectRepo_1.listProjectsForUser)(userId);
    }
    async create(ownerId, params) {
        const project = await (0, projectRepo_1.createProject)({ ownerId, title: params.title, orgId: params.orgId, meta: params.meta });
        // owner'ı member olarak ekle
        await (0, projectRepo_1.addProjectMember)(project.id, ownerId, 'owner');
        return project;
    }
    async get(id, actorId) {
        const p = await (0, projectRepo_1.getProject)(id);
        if (!p)
            throw (0, ApiError_1.notFound)('Project not found');
        if (actorId) {
            const role = await (0, projectRepo_1.getMemberRole)(id, actorId);
            if (!role)
                throw (0, ApiError_1.forbidden)('No access to project');
        }
        return p;
    }
    async update(id, data, actorId) {
        if (actorId) {
            const role = await (0, projectRepo_1.getMemberRole)(id, actorId);
            if (!role)
                throw (0, ApiError_1.forbidden)('No access to project');
            if (data.status && role !== 'owner')
                throw (0, ApiError_1.forbidden)('Only owner can change status');
        }
        return (0, projectRepo_1.updateProject)(id, data);
    }
    async delete(id, actorId) {
        if (actorId) {
            const role = await (0, projectRepo_1.getMemberRole)(id, actorId);
            if (role !== 'owner')
                throw (0, ApiError_1.forbidden)('Only owner can delete project');
        }
        await (0, projectRepo_1.softDeleteProject)(id);
    }
    async addMember(projectId, userId, role, actorId) {
        if (actorId) {
            const actorRole = await (0, projectRepo_1.getMemberRole)(projectId, actorId);
            if (actorRole !== 'owner')
                throw (0, ApiError_1.forbidden)('Only owner can add members');
        }
        return (0, projectRepo_1.addProjectMember)(projectId, userId, role);
    }
    async members(projectId, actorId) {
        if (actorId) {
            const role = await (0, projectRepo_1.getMemberRole)(projectId, actorId);
            if (!role)
                throw (0, ApiError_1.forbidden)('No access to members');
        }
        return (0, projectRepo_1.listProjectMembers)(projectId);
    }
    async removeMember(projectId, userId, actorId) {
        if (actorId) {
            const role = await (0, projectRepo_1.getMemberRole)(projectId, actorId);
            if (role !== 'owner')
                throw (0, ApiError_1.forbidden)('Only owner can remove members');
        }
        await (0, projectRepo_1.removeProjectMember)(projectId, userId);
    }
}
exports.ProjectService = ProjectService;
