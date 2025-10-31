"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjectsController = listProjectsController;
exports.createProjectController = createProjectController;
exports.getProjectController = getProjectController;
exports.updateProjectController = updateProjectController;
exports.deleteProjectController = deleteProjectController;
exports.addMemberController = addMemberController;
exports.listMembersController = listMembersController;
exports.removeMemberController = removeMemberController;
const project_service_1 = require("../service/project.service");
const service = new project_service_1.ProjectService();
async function listProjectsController(req, res) {
    const ownerId = req.user.id;
    const data = await service.list(ownerId);
    res.status(200).json(data);
}
async function createProjectController(req, res) {
    const ownerId = req.user.id;
    const project = await service.create(ownerId, req.body);
    res.status(201).json(project);
}
async function getProjectController(req, res) {
    const id = req.params.id;
    const p = await service.get(id, req.user.id);
    res.status(200).json(p);
}
async function updateProjectController(req, res) {
    const id = req.params.id;
    const p = await service.update(id, req.body, req.user.id);
    res.status(200).json(p);
}
async function deleteProjectController(req, res) {
    const id = req.params.id;
    await service.delete(id, req.user.id);
    res.status(204).send();
}
async function addMemberController(req, res) {
    const id = req.params.id;
    const m = await service.addMember(id, req.body.userId, req.body.role ?? 'editor', req.user.id);
    res.status(200).json(m);
}
async function listMembersController(req, res) {
    const id = req.params.id;
    const m = await service.members(id, req.user.id);
    res.status(200).json(m);
}
async function removeMemberController(req, res) {
    const id = req.params.id;
    const userId = req.params.userId;
    await service.removeMember(id, userId, req.user.id);
    res.status(204).send();
}
