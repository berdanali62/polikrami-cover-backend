import { z } from 'zod';

/**
 * Create comment schema
 * Supports both text comments and star ratings (for customer reviews)
 */
export const createCommentSchema = z.object({
  projectId: z.string().uuid({ 
    message: 'Geçerli bir proje ID (UUID) giriniz.' 
  }),
  body: z.string()
    .min(1, { message: 'Yorum içeriği boş olamaz.' })
    .max(1000, { message: 'Yorum en fazla 1000 karakter olabilir.' })
    .trim(),
  targetLayerId: z.string().uuid({
    message: 'Geçerli bir katman ID (UUID) giriniz.'
  }).optional(),
  // For UI star rating (if enabled in schema)
  rating: z.number()
    .int()
    .min(1, { message: 'Değerlendirme en az 1 yıldız olmalıdır.' })
    .max(5, { message: 'Değerlendirme en fazla 5 yıldız olabilir.' })
    .optional()
});

/**
 * Update comment schema
 * Allows partial updates
 */
export const updateCommentSchema = z.object({
  body: z.string()
    .min(1, { message: 'Yorum içeriği boş olamaz.' })
    .max(1000, { message: 'Yorum en fazla 1000 karakter olabilir.' })
    .trim()
    .optional(),
  status: z.enum(['open', 'resolved'], {
    errorMap: () => ({ message: 'Durum "open" veya "resolved" olmalıdır.' })
  }).optional(),
  rating: z.number()
    .int()
    .min(1)
    .max(5)
    .optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'En az bir alan güncellenmelidir.' }
);

/**
 * List comments query schema
 * Supports filtering and pagination
 */
export const listCommentsSchema = z.object({
  projectId: z.string().uuid({
    message: 'Geçerli bir proje ID giriniz.'
  }).optional(),
  layerId: z.string().uuid({
    message: 'Geçerli bir katman ID giriniz.'
  }).optional(),
  status: z.enum(['open', 'resolved', 'all'], {
    errorMap: () => ({ message: 'Durum "open", "resolved" veya "all" olmalıdır.' })
  }).default('all'),
  page: z.coerce.number()
    .int({ message: 'Sayfa numarası tam sayı olmalıdır.' })
    .min(1, { message: 'Sayfa numarası en az 1 olmalıdır.' })
    .default(1),
  limit: z.coerce.number()
    .int({ message: 'Limit tam sayı olmalıdır.' })
    .min(1, { message: 'Limit en az 1 olmalıdır.' })
    .max(100, { message: 'Limit en fazla 100 olabilir.' })
    .default(20)
});

/**
 * Project ID param schema
 * For stats endpoint
 */
export const projectIdParamSchema = z.object({
  projectId: z.string().uuid({
    message: 'Geçerli bir proje ID giriniz.'
  })
});

/**
 * Comment ID param schema
 */
export const commentIdParamSchema = z.object({
  id: z.string().uuid({
    message: 'Geçerli bir yorum ID giriniz.'
  })
});

// Type exports
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
export type ListCommentsDto = z.infer<typeof listCommentsSchema>;
export type ProjectIdParamDto = z.infer<typeof projectIdParamSchema>;
export type CommentIdParamDto = z.infer<typeof commentIdParamSchema>;