import { z } from 'zod';

export const createProjectSchema = z.object({
	title: z.string().min(1, { message: 'Proje başlığı boş olamaz.' }),
	orgId: z.string().uuid({ message: 'Geçerli bir organizasyon ID (UUID) giriniz.' }).optional(),
	meta: z.record(z.any(), { message: 'Meta bilgisi geçersiz.' }).optional(),
});

export const updateProjectSchema = z.object({
	title: z.string().min(1, { message: 'Proje başlığı boş olamaz.' }).optional(),
	status: z.enum(['active', 'archived', 'deleted'], { message: 'Geçersiz proje durumu.' }).optional(),
	meta: z
		.record(z.any(), { message: 'Meta bilgisi geçersiz.' })
		.nullable()
		.optional(),
});

export const addMemberSchema = z.object({
	userId: z.string().uuid({ message: 'Geçerli bir kullanıcı ID (UUID) giriniz.' }),
	role: z.string().min(2, { message: 'Rol adı en az 2 karakter olmalıdır.' }).default('editor').optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type AddMemberDto = z.infer<typeof addMemberSchema>;


