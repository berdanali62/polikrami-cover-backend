import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  password: z.string().min(8, { message: 'Şifre en az 8 karakter olmalıdır.' }),
  remember: z.boolean().optional().default(false),
});

export type LoginDto = z.infer<typeof loginSchema>;

