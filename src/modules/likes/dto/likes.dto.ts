import { z } from 'zod';

export const toggleLikeSchema = z.object({
  messageCardId: z.string().uuid('Invalid message card ID format'),
});

export const likeSummaryParamsSchema = z.object({
  id: z.string().uuid('Invalid message card ID format'),
});

export type ToggleLikeDto = z.infer<typeof toggleLikeSchema>;
export type LikeSummaryParamsDto = z.infer<typeof likeSummaryParamsSchema>;