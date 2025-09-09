import { z } from 'zod';

export const grantSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().int().min(1),
  note: z.string().max(200).optional(),
});

export const purchaseSchema = z.object({
  pack: z.enum(['300', '500', '1000']),
});


