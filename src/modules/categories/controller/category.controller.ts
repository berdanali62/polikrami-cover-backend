import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { createCategorySchema, updateCategorySchema } from '../dto/category.dto';
import { notFound, badRequest } from '../../../shared/errors/ApiError';

export async function listCategoriesController(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
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

export async function getCategoryController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const categoryId = parseInt(id);
  
  if (isNaN(categoryId)) {
    throw badRequest('Invalid category ID');
  }
  
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      templates: {
        include: { template: true }
      }
    }
  });
  
  if (!category) {
    throw notFound('Category not found');
  }
  
  res.status(200).json({
    ...category,
    templates: category.templates.map(tc => tc.template)
  });
}

export async function createCategoryController(req: Request, res: Response) {
  const data = createCategorySchema.parse(req.body);
  
  // Check if slug already exists
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw badRequest('Category slug already exists');
  }
  
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
}

export async function updateCategoryController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const categoryId = parseInt(id);
  const data = updateCategorySchema.parse(req.body);
  
  if (isNaN(categoryId)) {
    throw badRequest('Invalid category ID');
  }
  
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    throw notFound('Category not found');
  }
  
  // Check slug uniqueness if updating
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      throw badRequest('Category slug already exists');
    }
  }
  
  const category = await prisma.category.update({
    where: { id: categoryId },
    data
  });
  
  res.status(200).json(category);
}

export async function deleteCategoryController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const categoryId = parseInt(id);
  
  if (isNaN(categoryId)) {
    throw badRequest('Invalid category ID');
  }
  
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existing) {
    throw notFound('Category not found');
  }
  
  await prisma.category.delete({ where: { id: categoryId } });
  res.status(204).send();
}
