import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'canceled', 'refunded']),
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().min(3).max(500).optional(),
});


