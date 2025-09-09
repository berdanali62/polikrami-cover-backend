import { z } from 'zod';

export const generateSchema = z.object({
  templateId: z.string().optional(),
  fields: z.record(z.any()).optional(),
  userPrompt: z.string().optional(),
  count: z.coerce.number().int().min(1).max(6).default(3),
});

export const regenSchema = z.object({
  count: z.coerce.number().int().min(1).max(6).default(3),
});

export const selectSchema = z.object({
  imageId: z.string().uuid(),
});


