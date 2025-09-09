import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  // Login için karmaşıklık şartı uygulanmaz; sadece dolu olmalı
  password: z.string().min(1, { message: 'Şifre gerekli.' }),
  remember: z.boolean().optional().default(false),
});

export type LoginDto = z.infer<typeof loginSchema>;

