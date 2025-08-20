import { z } from 'zod';

export const updateProfileSchema = z.object({
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  address1: z.string().max(200).optional().nullable(),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(30).optional().nullable(),
  country: z.string().max(2).optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

