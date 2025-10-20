import { z } from 'zod';

export const createReturnSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(3),
  note: z.string().optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(['requested','approved','rejected','received','refunded','canceled']),
  note: z.string().optional(),
});

export const returnParamSchema = z.object({ id: z.string().uuid() });


