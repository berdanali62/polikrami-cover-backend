import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'canceled', 'refunded']),
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;


