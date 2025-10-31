"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyOrganizationsController = listMyOrganizationsController;
exports.getOrganizationController = getOrganizationController;
exports.createOrganizationController = createOrganizationController;
exports.updateOrganizationController = updateOrganizationController;
exports.deleteOrganizationController = deleteOrganizationController;
exports.addMemberController = addMemberController;
exports.updateMemberRoleController = updateMemberRoleController;
exports.removeMemberController = removeMemberController;
const database_1 = require("../../../config/database");
const ApiError_1 = require("../../../shared/errors/ApiError");
const organization_dto_1 = require("../dto/organization.dto");
async function listMyOrganizationsController(req, res) {
    const userId = req.user.id;
    const orgs = await database_1.prisma.organization.findMany({
        where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        include: { _count: { select: { members: true, projects: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(orgs);
}
async function getOrganizationController(req, res) {
    const { id } = req.params;
    const org = await database_1.prisma.organization.findUnique({
        where: { id },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });
    if (!org)
        throw (0, ApiError_1.notFound)('Organization not found');
    res.status(200).json(org);
}
async function createOrganizationController(req, res) {
    const { name, slug } = organization_dto_1.createOrganizationSchema.parse(req.body);
    const ownerId = req.user.id;
    const exists = await database_1.prisma.organization.findUnique({ where: { slug } });
    if (exists)
        throw (0, ApiError_1.badRequest)('Slug already exists');
    const org = await database_1.prisma.organization.create({ data: { name, slug, ownerId } });
    res.status(201).json(org);
}
async function updateOrganizationController(req, res) {
    const { id } = req.params;
    const data = organization_dto_1.updateOrganizationSchema.parse(req.body);
    const userId = req.user.id;
    const org = await database_1.prisma.organization.findUnique({ where: { id } });
    if (!org)
        throw (0, ApiError_1.notFound)('Organization not found');
    if (org.ownerId !== userId)
        throw (0, ApiError_1.forbidden)('Only owner can update organization');
    if (data.slug && data.slug !== org.slug) {
        const exists = await database_1.prisma.organization.findUnique({ where: { slug: data.slug } });
        if (exists)
            throw (0, ApiError_1.badRequest)('Slug already exists');
    }
    const updated = await database_1.prisma.organization.update({ where: { id }, data });
    res.status(200).json(updated);
}
async function deleteOrganizationController(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const org = await database_1.prisma.organization.findUnique({ where: { id } });
    if (!org)
        throw (0, ApiError_1.notFound)('Organization not found');
    if (org.ownerId !== userId)
        throw (0, ApiError_1.forbidden)('Only owner can delete organization');
    await database_1.prisma.organization.delete({ where: { id } });
    res.status(204).send();
}
async function addMemberController(req, res) {
    const { id } = req.params;
    const { userId, role } = organization_dto_1.addMemberSchema.parse(req.body);
    const me = req.user.id;
    const org = await database_1.prisma.organization.findUnique({ where: { id } });
    if (!org)
        throw (0, ApiError_1.notFound)('Organization not found');
    if (org.ownerId !== me)
        throw (0, ApiError_1.forbidden)('Only owner can add member');
    await database_1.prisma.organizationMember.create({ data: { organizationId: id, userId, role } });
    res.status(201).json({ ok: true });
}
async function updateMemberRoleController(req, res) {
    const { id, userId } = req.params;
    const { role } = organization_dto_1.updateMemberRoleSchema.parse(req.body);
    const me = req.user.id;
    const org = await database_1.prisma.organization.findUnique({ where: { id } });
    if (!org)
        throw (0, ApiError_1.notFound)('Organization not found');
    if (org.ownerId !== me)
        throw (0, ApiError_1.forbidden)('Only owner can update member roles');
    await database_1.prisma.organizationMember.update({ where: { organizationId_userId: { organizationId: id, userId } }, data: { role } });
    res.status(200).json({ ok: true });
}
async function removeMemberController(req, res) {
    const { id, userId } = req.params;
    const me = req.user.id;
    const org = await database_1.prisma.organization.findUnique({ where: { id } });
    if (!org)
        throw (0, ApiError_1.notFound)('Organization not found');
    if (org.ownerId !== me)
        throw (0, ApiError_1.forbidden)('Only owner can remove member');
    await database_1.prisma.organizationMember.delete({ where: { organizationId_userId: { organizationId: id, userId } } });
    res.status(204).send();
}
