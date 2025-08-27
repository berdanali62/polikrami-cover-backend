import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const searchSchema = z.object({
  q: z.string().min(1, { message: 'Arama terimi boş olamaz.' }).max(100),
  type: z.enum(['all', 'templates', 'projects', 'designers']).default('all'),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export async function globalSearchController(req: Request, res: Response) {
  const { q, type, category, limit } = searchSchema.parse(req.query);
  const searchTerm = q.toLowerCase();
  
  const results: any = {
    query: q,
    results: {}
  };
  
  try {
    if (type === 'all' || type === 'templates') {
      // Search templates
      const templateWhere: Prisma.TemplateWhereInput = {
        isPublished: true,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };
      
      if (category) {
        templateWhere.categories = {
          some: {
            category: { slug: category }
          }
        };
      }
      
      const templates = await prisma.template.findMany({
        where: templateWhere,
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      results.results.templates = templates.map(t => ({
        ...t,
        categories: t.categories.map(tc => tc.category),
        tags: t.tags.map(tt => tt.tag)
      }));
    }
    
    if (type === 'all' || type === 'designers') {
      // Search designers
      const designers = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: { name: 'designer' }
            }
          },
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          profile: true
        },
        take: limit
      });
      
      results.results.designers = designers;
    }
    
    if (req.user && (type === 'all' || type === 'projects')) {
      // Search user's projects (authenticated only)
      const projects = await prisma.project.findMany({
        where: {
          ownerId: req.user.id,
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      results.results.projects = projects;
    }
    
    res.status(200).json(results);
    
  } catch (error) {
    const { logger } = await import('../../../utils/logger');
    logger.error({ error, searchTerm, type }, 'Search failed');
    res.status(500).json({ message: 'Search failed' });
  }
}

export async function searchSuggestionsController(req: Request, res: Response) {
  const { q } = z.object({
    q: z.string().min(1).max(50)
  }).parse(req.query);
  
  const searchTerm = q.toLowerCase();
  
  try {
    // Get popular search suggestions
    const [categories, tags, templates] = await Promise.all([
      prisma.category.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 5,
        select: { name: true, slug: true }
      }),
      prisma.tag.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 5,
        select: { name: true, slug: true }
      }),
      prisma.template.findMany({
        where: {
          isPublished: true,
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 5,
        select: { title: true, slug: true }
      })
    ]);
    
    const suggestions = [
      ...categories.map(c => ({ type: 'category', text: c.name, value: c.slug })),
      ...tags.map(t => ({ type: 'tag', text: t.name, value: t.slug })),
      ...templates.map(t => ({ type: 'template', text: t.title, value: t.slug }))
    ];
    
    res.status(200).json({ suggestions: suggestions.slice(0, 10) });
    
  } catch (error) {
    const { logger } = await import('../../../utils/logger');
    logger.error({ error, searchTerm }, 'Search suggestions failed');
    res.status(500).json({ message: 'Search suggestions failed' });
  }
}
