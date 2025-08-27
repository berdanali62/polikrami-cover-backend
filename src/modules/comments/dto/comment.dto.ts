import { z } from 'zod';

export const createCommentSchema = z.object({
  projectId: z.string().uuid({ message: 'Geçerli bir proje ID (UUID) giriniz.' }),
  body: z.string().min(1, { message: 'Yorum içeriği boş olamaz.' }).max(1000),
  targetLayerId: z.string().uuid().optional()
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, { message: 'Yorum içeriği boş olamaz.' }).max(1000).optional(),
  status: z.enum(['open', 'resolved']).optional()
});

export const listCommentsSchema = z.object({
  projectId: z.string().uuid().optional(),
  layerId: z.string().uuid().optional(),
  status: z.enum(['open', 'resolved', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
export type ListCommentsDto = z.infer<typeof listCommentsSchema>;
