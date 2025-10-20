// src/modules/drafts/dto/draft.dto.ts
import { z } from 'zod';

// ============ CREATE & UPDATE SCHEMAS ============
export const createDraftSchema = z.object({
  method: z.enum(['upload', 'ai', 'artist'], { 
    message: 'Geçersiz yöntem. Geçerli değerler: upload, ai, artist.' 
  }),
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

// ============ ASSIGNMENT SCHEMAS ============
export const assignDesignerSchema = z.object({
  designerId: z.string().uuid({ message: 'Geçerli bir sanatçı ID (UUID) giriniz.' }),
});

// ============ MESSAGE CARD SCHEMAS ============
export const setMessageCardSchema = z.object({
  messageCardId: z.string().uuid({ message: 'Geçerli bir mesaj kartı ID (UUID) giriniz.' }),
  to: z.string().min(1, { message: 'Alıcı adı boş olamaz.' }).optional(),
  signature: z.string().min(1, { message: 'İmza/metin boş olamaz.' }).optional(),
  content: z.string().min(1, { message: 'Mesaj içeriği boş olamaz.' }).optional(),
});

// ============ SHIPPING SCHEMAS ============
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

// New: use a saved Address by ID and snapshot it into draft.shipping
export const setShippingAddressIdSchema = z.object({
  addressId: z.string().uuid({ message: 'Geçerli bir adres ID (UUID) giriniz.' }),
});

// ============ UPLOAD SCHEMAS ============
export const presignUploadSchema = z.object({
  contentType: z
    .string()
    .min(3)
    .regex(/^[\w.-]+\/[\w.+-]+$/, { message: 'Geçersiz içerik tipi formatı.' })
    .optional(),
});

export const uploadFileSchema = z.object({
  // no body fields; multipart file named "file"
});

// ============ WORKFLOW SCHEMAS ============
export const sendPreviewSchema = z.object({
  message: z.string().optional(),
});

export const requestRevisionSchema = z.object({
  notes: z.string()
    .min(10, { message: 'Revizyon notları en az 10 karakter olmalıdır.' })
    .max(500, { message: 'Revizyon notları en fazla 500 karakter olabilir.' })
    .optional(),
});

export const approveDesignSchema = z.object({
  rating: z.number()
    .int({ message: 'Puan tam sayı olmalıdır.' })
    .min(1, { message: 'Puan en az 1 olmalıdır.' })
    .max(5, { message: 'Puan en fazla 5 olabilir.' })
    .optional(),
  comment: z.string()
    .max(500, { message: 'Yorum en fazla 500 karakter olabilir.' })
    .optional(),
});

export const cancelDraftSchema = z.object({
  reason: z.string()
    .min(5, { message: 'İptal nedeni en az 5 karakter olmalıdır.' })
    .max(200, { message: 'İptal nedeni en fazla 200 karakter olabilir.' })
    .optional(),
});

// ============ QUERY PARAMETER SCHEMAS ============
export const listDraftsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  status: z.enum([
    'PENDING',
    'IN_PROGRESS', 
    'PREVIEW_SENT',
    'REVISION',
    'COMPLETED',
    'CANCELED'
  ]).optional(),
  include: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ============ PARAMETER SCHEMAS ============
export const draftIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Geçerli bir taslak ID (UUID) giriniz.' }),
});

// ============ COMBINED WORKFLOW ACTION SCHEMA ============
export const workflowActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('sendPreview'),
    message: z.string().optional(),
  }),
  z.object({
    action: z.literal('requestRevision'),
    notes: z.string().min(10).max(500).optional(),
  }),
  z.object({
    action: z.literal('approve'),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('cancel'),
    reason: z.string().min(5).max(200).optional(),
  }),
]);

// ============ TYPE EXPORTS ============
export type CreateDraftDto = z.infer<typeof createDraftSchema>;
export type UpdateDraftDto = z.infer<typeof updateDraftSchema>;
export type AssignDesignerDto = z.infer<typeof assignDesignerSchema>;
export type SetMessageCardDto = z.infer<typeof setMessageCardSchema>;
export type SetShippingDto = z.infer<typeof setShippingSchema>;
export type SetShippingAddressIdDto = z.infer<typeof setShippingAddressIdSchema>;
export type SetBillingAddressDto = z.infer<typeof setBillingAddressSchema>;
export type PresignUploadDto = z.infer<typeof presignUploadSchema>;
export type UploadFileDto = z.infer<typeof uploadFileSchema>;
export type SendPreviewDto = z.infer<typeof sendPreviewSchema>;
export type RequestRevisionDto = z.infer<typeof requestRevisionSchema>;
export type ApproveDesignDto = z.infer<typeof approveDesignSchema>;
export type CancelDraftDto = z.infer<typeof cancelDraftSchema>;
export type ListDraftsQueryDto = z.infer<typeof listDraftsQuerySchema>;
export type DraftIdParamDto = z.infer<typeof draftIdParamSchema>;
export type WorkflowActionDto = z.infer<typeof workflowActionSchema>;

// ============ VALIDATION HELPERS ============
export const validatePhoneNumber = z.string().refine(
  (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Turkish phone validation
    if (cleanPhone.startsWith('0')) return cleanPhone.length === 11;
    if (cleanPhone.startsWith('90')) return cleanPhone.length === 12;
    if (cleanPhone.startsWith('5')) return cleanPhone.length === 10;
    // International format
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  },
  { message: 'Geçersiz telefon numarası formatı.' }
);

// Enhanced shipping schema with phone validation
export const enhancedShippingSchema = z.object({
  shipping: z.object({
    senderName: z.string()
      .min(1, { message: 'Gönderici adı boş olamaz.' })
      .max(100, { message: 'Gönderici adı en fazla 100 karakter olabilir.' }),
    senderPhone: validatePhoneNumber,
    receiverName: z.string()
      .min(1, { message: 'Alıcı adı boş olamaz.' })
      .max(100, { message: 'Alıcı adı en fazla 100 karakter olabilir.' }),
    receiverPhone: validatePhoneNumber,
    city: z.string()
      .min(1, { message: 'Şehir boş olamaz.' })
      .max(50, { message: 'Şehir adı en fazla 50 karakter olabilir.' }),
    district: z.string()
      .min(1, { message: 'İlçe boş olamaz.' })
      .max(50, { message: 'İlçe adı en fazla 50 karakter olabilir.' }),
    address: z.string()
      .min(5, { message: 'Adres en az 5 karakter olmalıdır.' })
      .max(250, { message: 'Adres en fazla 250 karakter olabilir.' }),
    company: z.string()
      .max(100, { message: 'Firma adı en fazla 100 karakter olabilir.' })
      .optional(),
  }),
});

// ============ BILLING (INVOICE) ADDRESS SCHEMA ============
// Ephemeral billing address for checkout; not persisted in Address table
export const setBillingAddressSchema = z.object({
  sameAsShipping: z.boolean().default(true),
  billing: z.object({
    type: z.enum(['personal', 'corporate']).default('personal'),
    firstName: z.string().min(2).max(60),
    lastName: z.string().min(2).max(60),
    phone: validatePhoneNumber,
    city: z.string().min(2).max(50),
    district: z.string().min(2).max(50),
    address: z.string().min(5).max(250),
    postalCode: z.string().regex(/^\d{5}$/).optional(),
    country: z.string().length(2).default('TR'),
    // Corporate fields
    taxNumber: z.string().regex(/^\d{10,11}$/).optional(), // VKN(10)/TCKN(11)
    taxOffice: z.string().max(80).optional(),
    companyName: z.string().max(120).optional(),
  }).partial().refine((val) => {
    if (!val) return true;
    if (val.type === 'corporate') {
      return Boolean(val.taxNumber) && Boolean(val.taxOffice) && Boolean(val.companyName);
    }
    return true;
  }, { message: 'Kurumsal fatura için vergi no/daire ve firma adı zorunludur.' }),
});

// ============ RESPONSE SCHEMAS (for API documentation) ============
export const draftResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  method: z.enum(['upload', 'ai', 'artist']),
  step: z.number(),
  workflowStatus: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'PREVIEW_SENT',
    'REVISION',
    'COMPLETED',
    'CANCELED'
  ]),
  revisionCount: z.number(),
  maxRevisions: z.number(),
  data: z.any().nullable(),
  messageCardId: z.string().uuid().nullable(),
  shipping: z.any().nullable(),
  assignedDesignerId: z.string().uuid().nullable(),
  committedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const draftListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(draftResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const workflowHistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string().uuid(),
    event: z.string(),
    occurredAt: z.date(),
    userId: z.string().uuid(),
    metadata: z.any().optional(),
  })),
});

export const revisionDetailsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    currentRevision: z.number(),
    maxRevisions: z.number(),
    remainingRevisions: z.number(),
    history: z.array(z.object({
      revisionNumber: z.number(),
      requestedAt: z.date(),
      notes: z.string().optional(),
    })),
  }),
});

// ============ ERROR RESPONSE SCHEMA ============
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
});

// ============ CONSTANTS ============
export const DRAFT_METHODS = ['upload', 'ai', 'artist'] as const;
export const WORKFLOW_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'PREVIEW_SENT',
  'REVISION',
  'COMPLETED',
  'CANCELED'
] as const;
export const MAX_REVISIONS = 3;
export const MAX_UPLOAD_SIZE_MB = 100;
export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf'
] as const;