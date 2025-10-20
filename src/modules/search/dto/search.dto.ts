import { z } from 'zod';

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string()
    .max(100, { message: 'Arama terimi en fazla 100 karakter olabilir.' })
    .transform(val => val.trim())
    .optional()
    .default(''),
  
  type: z.enum(['all', 'templates', 'projects', 'designers'], {
    errorMap: () => ({ message: 'Geçersiz arama tipi.' })
  }).default('all'),
  
  category: z.string()
    .max(50, { message: 'Kategori slug\'ı çok uzun.' })
    .regex(/^[a-z0-9-]+$/, { message: 'Geçersiz kategori slug formatı.' })
    .optional(),
  
  tag: z.string()
    .max(50, { message: 'Tag slug\'ı çok uzun.' })
    .regex(/^[a-z0-9-]+$/, { message: 'Geçersiz tag slug formatı.' })
    .optional(),
  
  page: z.coerce.number()
    .int({ message: 'Sayfa numarası tam sayı olmalıdır.' })
    .min(1, { message: 'Sayfa numarası en az 1 olmalıdır.' })
    .max(100, { message: 'Sayfa numarası en fazla 100 olabilir.' })
    .default(1),
  
  limit: z.coerce.number()
    .int({ message: 'Limit tam sayı olmalıdır.' })
    .min(1, { message: 'Limit en az 1 olmalıdır.' })
    .max(50, { message: 'Limit en fazla 50 olabilir.' })
    .default(20)
});

/**
 * Suggestions query schema
 */
export const suggestionsQuerySchema = z.object({
  q: z.string()
    .max(50, { message: 'Arama terimi çok uzun.' })
    .transform(val => val.trim())
    .optional()
    .default(''),
  
  limit: z.coerce.number()
    .int()
    .min(1)
    .max(20)
    .default(10)
});

// Type exports
export type SearchQueryDto = z.infer<typeof searchQuerySchema>;
export type SuggestionsQueryDto = z.infer<typeof suggestionsQuerySchema>;