import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  password: z
    .string()
    .min(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
    .regex(/[A-Z]/, { message: 'Şifre en az bir büyük harf içermelidir (A-Z).' })
    .regex(/[a-z]/, { message: 'Şifre en az bir küçük harf içermelidir (a-z).' })
    .regex(/\d/, { message: 'Şifre en az bir rakam içermelidir (0-9).' })
    .regex(/[^A-Za-z0-9]/, { message: 'Şifre en az bir özel karakter içermelidir (ör. !@#$%^&*).' }),
  confirmPassword: z.string({ required_error: 'Lütfen şifrenizi tekrar giriniz.' }),
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }).max(100, { message: 'İsim en fazla 100 karakter olabilir.' }).optional(),
  role: z.enum(['user', 'designer'], { message: 'Geçersiz rol seçimi.' }).optional().default('user'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor. Lütfen aynı şifreyi tekrar giriniz.',
  path: ['confirmPassword'],
});

export type RegisterDto = z.infer<typeof registerSchema>;

