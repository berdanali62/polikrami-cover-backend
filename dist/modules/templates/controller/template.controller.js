"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplatesController = listTemplatesController;
exports.getTemplateBySlugController = getTemplateBySlugController;
exports.getTemplateByIdController = getTemplateByIdController;
exports.createTemplateController = createTemplateController;
exports.updateTemplateController = updateTemplateController;
exports.deleteTemplateController = deleteTemplateController;
exports.getPopularTemplatesController = getPopularTemplatesController;
const template_service_1 = require("../service/template.service");
const template_dto_1 = require("../dto/template.dto");
const templateService = new template_service_1.TemplateService();
async function listTemplatesController(req, res) {
    const params = template_dto_1.listTemplatesSchema.parse(req.query);
    const result = await templateService.list(params);
    res.status(200).json(result);
}
async function getTemplateBySlugController(req, res) {
    const { slug } = req.params;
    const template = await templateService.getBySlug(slug);
    res.status(200).json(template);
}
async function getTemplateByIdController(req, res) {
    const { id } = req.params;
    const template = await templateService.getById(id);
    res.status(200).json(template);
}
async function createTemplateController(req, res) {
    const data = template_dto_1.createTemplateSchema.parse(req.body);
    const authorId = req.user?.id; // Optional author
    const template = await templateService.create(data, authorId);
    res.status(201).json(template);
}
async function updateTemplateController(req, res) {
    const { id } = req.params;
    const data = template_dto_1.updateTemplateSchema.parse(req.body);
    const template = await templateService.update(id, data);
    res.status(200).json(template);
}
async function deleteTemplateController(req, res) {
    const { id } = req.params;
    await templateService.delete(id);
    res.status(204).send();
}
async function getPopularTemplatesController(_req, res) {
    const templates = await templateService.getPopular(12);
    res.status(200).json(templates);
}
