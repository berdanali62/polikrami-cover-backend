import { z } from 'zod';

export const createDraftSchema = z.object({
	method: z.enum(['upload', 'ai', 'artist'], { message: 'Geçersiz yöntem. Geçerli değerler: upload, ai, artist.' }),
});

export const updateDraftSchema = z.object({
	step: z
		.number({ invalid_type_error: 'Adım numarası sayı olmalıdır.' })
		.int({ message: 'Adım numarası tam sayı olmalıdır.' })
		.min(1, { message: 'Adım en az 1 olmalıdır.' })
		.max(5, { message: 'Adım en fazla 5 olabilir.' })
		.optional(),
	data: z.record(z.any(), { message: 'Veri formatı geçersiz.' }).optional(),
	messageCardId: z.string().uuid({ message: 'Geçerli bir mesaj kartı ID (UUID) giriniz.' }).optional(),
});

export const assignDesignerSchema = z.object({
	designerId: z.string().uuid({ message: 'Geçerli bir sanatçı ID (UUID) giriniz.' }),
});

export const setMessageCardSchema = z.object({
	messageCardId: z.string().uuid({ message: 'Geçerli bir mesaj kartı ID (UUID) giriniz.' }),
	to: z.string().min(1, { message: 'Alıcı adı boş olamaz.' }).optional(),
	signature: z.string().min(1, { message: 'İmza/metin boş olamaz.' }).optional(),
	content: z.string().min(1, { message: 'Mesaj içeriği boş olamaz.' }).optional(),
});

export const setShippingSchema = z.object({
	shipping: z.object({
		senderName: z.string().min(1, { message: 'Gönderici adı boş olamaz.' }),
		senderPhone: z.string().min(5, { message: 'Gönderici telefon numarası geçersiz.' }),
		receiverName: z.string().min(1, { message: 'Alıcı adı boş olamaz.' }),
		receiverPhone: z.string().min(5, { message: 'Alıcı telefon numarası geçersiz.' }),
		city: z.string().min(1, { message: 'Şehir boş olamaz.' }),
		district: z.string().min(1, { message: 'İlçe boş olamaz.' }),
		address: z.string().min(5, { message: 'Adres en az 5 karakter olmalıdır.' }),
		company: z.string().optional(),
	}),
});

export const presignUploadSchema = z.object({
  contentType: z
    .string()
    .min(3)
    .regex(/^[\w.-]+\/[\w.+-]+$/)
    .optional(),
});

export const uploadFileSchema = z.object({
  // no body fields; multipart file named "file"
});

export type CreateDraftDto = z.infer<typeof createDraftSchema>;
export type UpdateDraftDto = z.infer<typeof updateDraftSchema>;
export type PresignUploadDto = z.infer<typeof presignUploadSchema>;

