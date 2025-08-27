import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, { message: 'Kategori adı boş olamaz.' }).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir.' })
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional()
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
