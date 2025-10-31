"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategoriesController = listCategoriesController;
exports.getCategoryController = getCategoryController;
exports.createCategoryController = createCategoryController;
exports.updateCategoryController = updateCategoryController;
exports.deleteCategoryController = deleteCategoryController;
const database_1 = require("../../../config/database");
const category_dto_1 = require("../dto/category.dto");
const ApiError_1 = require("../../../shared/errors/ApiError");
async function listCategoriesController(_req, res) {
    const categories = await database_1.prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { templates: true }
            }
        }
    });
    res.status(200).json(categories.map(cat => ({
        ...cat,
        templateCount: cat._count.templates
    })));
}
async function getCategoryController(req, res) {
    const { id } = req.params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
        throw (0, ApiError_1.badRequest)('Invalid category ID');
    }
    const category = await database_1.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            templates: {
                include: { template: true }
            }
        }
    });
    if (!category) {
        throw (0, ApiError_1.notFound)('Category not found');
    }
    res.status(200).json({
        ...category,
        templates: category.templates.map(tc => tc.template)
    });
}
async function createCategoryController(req, res) {
    const data = category_dto_1.createCategorySchema.parse(req.body);
    // Check if slug already exists
    const existing = await database_1.prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) {
        throw (0, ApiError_1.badRequest)('Category slug already exists');
    }
    const category = await database_1.prisma.category.create({ data });
    res.status(201).json(category);
}
async function updateCategoryController(req, res) {
    const { id } = req.params;
    const categoryId = parseInt(id);
    const data = category_dto_1.updateCategorySchema.parse(req.body);
    if (isNaN(categoryId)) {
        throw (0, ApiError_1.badRequest)('Invalid category ID');
    }
    const existing = await database_1.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
        throw (0, ApiError_1.notFound)('Category not found');
    }
    // Check slug uniqueness if updating
    if (data.slug && data.slug !== existing.slug) {
        const slugExists = await database_1.prisma.category.findUnique({ where: { slug: data.slug } });
        if (slugExists) {
            throw (0, ApiError_1.badRequest)('Category slug already exists');
        }
    }
    const category = await database_1.prisma.category.update({
        where: { id: categoryId },
        data
    });
    res.status(200).json(category);
}
async function deleteCategoryController(req, res) {
    const { id } = req.params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
        throw (0, ApiError_1.badRequest)('Invalid category ID');
    }
    const existing = await database_1.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
        throw (0, ApiError_1.notFound)('Category not found');
    }
    await database_1.prisma.category.delete({ where: { id: categoryId } });
    res.status(204).send();
}
