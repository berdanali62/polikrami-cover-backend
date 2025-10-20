/* eslint-disable */
import { z } from 'zod';

export const sendPhoneCodeSchema = z.object({
  phone: z.string().min(5).max(30),
});

export const verifyPhoneCodeSchema = z.object({
  phone: z.string().min(5).max(30),
  code: z.string().regex(/^\d{4}$/, { message: 'Kod 4 haneli olmalıdır.' }),
});

export type SendPhoneCodeDto = z.infer<typeof sendPhoneCodeSchema>;
export type VerifyPhoneCodeDto = z.infer<typeof verifyPhoneCodeSchema>;

export const firebaseVerifySchema = z.object({
  idToken: z.string().min(20),
});

export type FirebaseVerifyDto = z.infer<typeof firebaseVerifySchema>;


