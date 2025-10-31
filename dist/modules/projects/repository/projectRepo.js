"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjectsForUser = listProjectsForUser;
exports.createProject = createProject;
exports.getProject = getProject;
exports.updateProject = updateProject;
exports.softDeleteProject = softDeleteProject;
exports.addProjectMember = addProjectMember;
exports.listProjectMembers = listProjectMembers;
exports.removeProjectMember = removeProjectMember;
exports.getMemberRole = getMemberRole;
const database_1 = require("../../../config/database");
const client_1 = require("@prisma/client");
async function listProjectsForUser(userId) {
    return database_1.prisma.project.findMany({
        where: {
            status: { not: 'deleted' },
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function createProject(params) {
    return database_1.prisma.project.create({ data: { ownerId: params.ownerId, orgId: params.orgId, title: params.title, meta: params.meta } });
}
async function getProject(id) {
    return database_1.prisma.project.findUnique({ where: { id } });
}
async function updateProject(id, data) {
    return database_1.prisma.project.update({
        where: { id },
        data: {
            title: data.title,
            status: data.status,
            meta: data.meta === null ? client_1.Prisma.DbNull : data.meta,
        },
    });
}
async function softDeleteProject(id) {
    return database_1.prisma.project.update({ where: { id }, data: { status: 'deleted' } });
}
async function addProjectMember(projectId, userId, role) {
    return database_1.prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        update: { role },
        create: { projectId, userId, role },
    });
}
async function listProjectMembers(projectId) {
    return database_1.prisma.projectMember.findMany({ where: { projectId }, include: { user: true } });
}
async function removeProjectMember(projectId, userId) {
    return database_1.prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
}
async function getMemberRole(projectId, userId) {
    const project = await database_1.prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project)
        return null;
    if (project.ownerId === userId)
        return 'owner';
    const membership = await database_1.prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } }, select: { role: true } });
    return membership?.role ?? null;
}
