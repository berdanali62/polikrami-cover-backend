import { z } from 'zod';

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;


