import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  code: z.string().regex(/^\d{4}$/, { message: 'Kod 4 haneli olmalıdır (0000-9999).' }),
});

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  code: z.string().regex(/^\d{4}$/, { message: 'Kod 4 haneli olmalıdır (0000-9999).' }),
  password: z
    .string()
    .min(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
    .regex(/[A-Z]/, { message: 'Şifre en az bir büyük harf içermelidir (A-Z).' })
    .regex(/[a-z]/, { message: 'Şifre en az bir küçük harf içermelidir (a-z).' })
    .regex(/\d/, { message: 'Şifre en az bir rakam içermelidir (0-9).' })
    .regex(/[^A-Za-z0-9]/, { message: 'Şifre en az bir özel karakter içermelidir (ör. !@#$%^&*).' }),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetCodeDto = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;


