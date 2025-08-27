import { prisma } from '../../../config/database';
import { notFound, badRequest } from '../../../shared/errors/ApiError';
import { Prisma } from '@prisma/client';

export class TemplateService {
  async list(params: {
    page: number;
    limit: number;
    category?: string;
    tag?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
    published: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    
    // Build where clause
    const where: Prisma.TemplateWhereInput = {};
    
    if (params.published === 'true') {
      where.isPublished = true;
    } else if (params.published === 'false') {
      where.isPublished = false;
    }
    
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
    }
    
    if (params.category) {
      where.categories = {
        some: {
          category: {
            slug: params.category
          }
        }
      };
    }
    
    if (params.tag) {
      where.tags = {
        some: {
          tag: {
            slug: params.tag
          }
        }
      };
    }
    
    // Build order by
    const orderBy: Prisma.TemplateOrderByWithRelationInput = {};
    if (params.sortBy === 'title') {
      orderBy.title = params.sortOrder as 'asc' | 'desc';
    } else if (params.sortBy === 'createdAt') {
      orderBy.createdAt = params.sortOrder as 'asc' | 'desc';
    }
    
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } }
        },
        orderBy,
        skip,
        take: params.limit
      }),
      prisma.template.count({ where })
    ]);
    
    return {
      templates: templates.map(template => ({
        ...template,
        categories: template.categories.map(tc => tc.category),
        tags: template.tags.map(tt => tt.tag)
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async getBySlug(slug: string) {
    const template = await prisma.template.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        versions: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!template) {
      throw notFound('Template not found');
    }
    
    return {
      ...template,
      categories: template.categories.map(tc => tc.category),
      tags: template.tags.map(tt => tt.tag)
    };
  }

  async getById(id: string) {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        versions: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!template) {
      throw notFound('Template not found');
    }
    
    return {
      ...template,
      categories: template.categories.map(tc => tc.category),
      tags: template.tags.map(tt => tt.tag)
    };
  }

  async create(data: {
    title: string;
    description?: string;
    slug: string;
    cover?: any;
    categoryIds?: number[];
    tagIds?: number[];
    isPublished?: boolean;
  }, authorId?: string) {
    // Check if slug already exists
    const existing = await prisma.template.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw badRequest('Template slug already exists');
    }

    return prisma.$transaction(async (tx) => {
      // Create template
      const template = await tx.template.create({
        data: {
          title: data.title,
          description: data.description,
          slug: data.slug,
          cover: data.cover as Prisma.InputJsonValue,
          authorId,
          isPublished: data.isPublished ?? false
        }
      });

      // Add categories
      if (data.categoryIds && data.categoryIds.length > 0) {
        await tx.templateCategory.createMany({
          data: data.categoryIds.map(categoryId => ({
            templateId: template.id,
            categoryId
          }))
        });
      }

      // Add tags
      if (data.tagIds && data.tagIds.length > 0) {
        await tx.templateTag.createMany({
          data: data.tagIds.map(tagId => ({
            templateId: template.id,
            tagId
          }))
        });
      }

      return template;
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    slug?: string;
    cover?: any;
    categoryIds?: number[];
    tagIds?: number[];
    isPublished?: boolean;
  }) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw notFound('Template not found');
    }

    // Check slug uniqueness if updating
    if (data.slug && data.slug !== template.slug) {
      const existing = await prisma.template.findUnique({ where: { slug: data.slug } });
      if (existing) {
        throw badRequest('Template slug already exists');
      }
    }

    return prisma.$transaction(async (tx) => {
      // Update template
      const updated = await tx.template.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          slug: data.slug,
          cover: data.cover as Prisma.InputJsonValue,
          isPublished: data.isPublished
        }
      });

      // Update categories
      if (data.categoryIds !== undefined) {
        await tx.templateCategory.deleteMany({ where: { templateId: id } });
        if (data.categoryIds.length > 0) {
          await tx.templateCategory.createMany({
            data: data.categoryIds.map(categoryId => ({
              templateId: id,
              categoryId
            }))
          });
        }
      }

      // Update tags
      if (data.tagIds !== undefined) {
        await tx.templateTag.deleteMany({ where: { templateId: id } });
        if (data.tagIds.length > 0) {
          await tx.templateTag.createMany({
            data: data.tagIds.map(tagId => ({
              templateId: id,
              tagId
            }))
          });
        }
      }

      return updated;
    });
  }

  async delete(id: string) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw notFound('Template not found');
    }

    return prisma.template.delete({ where: { id } });
  }

  async getPopular(limit = 10) {
    // Get templates with most usage (based on projects created from them)
    return prisma.template.findMany({
      where: { isPublished: true },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
