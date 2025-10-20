import { z } from 'zod';

/**
 * Admin grant credits schema
 */
export const grantSchema = z.object({
  userId: z.string().uuid({ 
    message: 'Geçerli bir kullanıcı ID giriniz.' 
  }),
  amount: z.coerce.number()
    .int({ message: 'Kredi miktarı tam sayı olmalıdır.' })
    .min(1, { message: 'En az 1 kredi verilmelidir.' })
    .max(10000, { message: 'Tek seferde en fazla 10000 kredi verilebilir.' }),
  note: z.string()
    .max(200, { message: 'Not en fazla 200 karakter olabilir.' })
    .optional()
});

/**
 * Credit package types
 */
export const CREDIT_PACKAGES = {
  basic: { credits: 300, price: 5000 }, // 50 TL
  standard: { credits: 500, price: 10000 }, // 100 TL
  premium: { credits: 1000, price: 20000 } // 200 TL
} as const;

/**
 * Purchase credits schema
 */
export const purchaseSchema = z.object({
  packageType: z.enum(['basic', 'standard', 'premium'], {
    errorMap: () => ({ message: 'Geçersiz kredi paketi.' })
  })
});

/**
 * History query schema
 */
export const historyQuerySchema = z.object({
  page: z.coerce.number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  type: z.enum(['all', 'spend', 'refund', 'purchase', 'gift'])
    .default('all')
});

// Type exports
export type GrantDto = z.infer<typeof grantSchema>;
export type PurchaseDto = z.infer<typeof purchaseSchema>;
export type HistoryQueryDto = z.infer<typeof historyQuerySchema>;