import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, { message: 'Ad soyad en az 2 karakter olmalı' }),
  email: z.string().email({ message: 'Geçerli bir e-posta giriniz' }),
  phone: z.string().max(50).optional().nullable(),
  message: z.string().min(5, { message: 'Mesaj en az 5 karakter olmalı' }),
});

export type ContactDto = z.infer<typeof contactSchema>;


