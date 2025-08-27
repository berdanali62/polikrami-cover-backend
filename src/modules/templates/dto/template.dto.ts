import { z } from 'zod';

export const createTemplateSchema = z.object({
  title: z.string().min(1, { message: 'Şablon başlığı boş olamaz.' }).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir.' }),
  cover: z.object({
    url: z.string().url(),
    width: z.number().positive(),
    height: z.number().positive(),
    thumbnailUrl: z.string().url().optional()
  }).optional(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  isPublished: z.boolean().default(false)
});

export const updateTemplateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  cover: z.object({
    url: z.string().url(),
    width: z.number().positive(),
    height: z.number().positive(),
    thumbnailUrl: z.string().url().optional()
  }).optional(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  isPublished: z.boolean().optional()
});

export const listTemplatesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'title', 'popularity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  published: z.enum(['true', 'false', 'all']).default('true')
});

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
export type ListTemplatesDto = z.infer<typeof listTemplatesSchema>;
