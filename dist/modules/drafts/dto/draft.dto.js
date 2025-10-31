"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_MIME_TYPES = exports.MAX_UPLOAD_SIZE_MB = exports.MAX_REVISIONS = exports.WORKFLOW_STATUSES = exports.DRAFT_METHODS = exports.errorResponseSchema = exports.revisionDetailsResponseSchema = exports.workflowHistoryResponseSchema = exports.draftListResponseSchema = exports.draftResponseSchema = exports.setBillingAddressSchema = exports.enhancedShippingSchema = exports.validatePhoneNumber = exports.workflowActionSchema = exports.draftIdParamSchema = exports.listDraftsQuerySchema = exports.cancelDraftSchema = exports.approveDesignSchema = exports.requestRevisionSchema = exports.sendPreviewSchema = exports.uploadFileSchema = exports.presignUploadSchema = exports.setShippingAddressIdSchema = exports.setShippingSchema = exports.setMessageCardSchema = exports.assignDesignerSchema = exports.updateDraftSchema = exports.createDraftSchema = void 0;
// src/modules/drafts/dto/draft.dto.ts
const zod_1 = require("zod");
// ============ CREATE & UPDATE SCHEMAS ============
exports.createDraftSchema = zod_1.z.object({
    method: zod_1.z.enum(['upload', 'ai', 'artist'], {
        message: 'Geçersiz yöntem. Geçerli değerler: upload, ai, artist.'
    }),
});
exports.updateDraftSchema = zod_1.z.object({
    step: zod_1.z
        .number({ invalid_type_error: 'Adım numarası sayı olmalıdır.' })
        .int({ message: 'Adım numarası tam sayı olmalıdır.' })
        .min(1, { message: 'Adım en az 1 olmalıdır.' })
        .max(5, { message: 'Adım en fazla 5 olabilir.' })
        .optional(),
    data: zod_1.z.record(zod_1.z.any(), { message: 'Veri formatı geçersiz.' }).optional(),
    messageCardId: zod_1.z.string().uuid({ message: 'Geçerli bir mesaj kartı ID (UUID) giriniz.' }).optional(),
});
// ============ ASSIGNMENT SCHEMAS ============
exports.assignDesignerSchema = zod_1.z.object({
    designerId: zod_1.z.string().uuid({ message: 'Geçerli bir sanatçı ID (UUID) giriniz.' }),
});
// ============ MESSAGE CARD SCHEMAS ============
exports.setMessageCardSchema = zod_1.z.object({
    messageCardId: zod_1.z.string().uuid({ message: 'Geçerli bir mesaj kartı ID (UUID) giriniz.' }),
    to: zod_1.z.string().min(1, { message: 'Alıcı adı boş olamaz.' }).optional(),
    signature: zod_1.z.string().min(1, { message: 'İmza/metin boş olamaz.' }).optional(),
    content: zod_1.z.string().min(1, { message: 'Mesaj içeriği boş olamaz.' }).optional(),
});
// ============ SHIPPING SCHEMAS ============
exports.setShippingSchema = zod_1.z.object({
    shipping: zod_1.z.object({
        senderName: zod_1.z.string().min(1, { message: 'Gönderici adı boş olamaz.' }),
        senderPhone: zod_1.z.string().min(5, { message: 'Gönderici telefon numarası geçersiz.' }),
        receiverName: zod_1.z.string().min(1, { message: 'Alıcı adı boş olamaz.' }),
        receiverPhone: zod_1.z.string().min(5, { message: 'Alıcı telefon numarası geçersiz.' }),
        city: zod_1.z.string().min(1, { message: 'Şehir boş olamaz.' }),
        district: zod_1.z.string().min(1, { message: 'İlçe boş olamaz.' }),
        address: zod_1.z.string().min(5, { message: 'Adres en az 5 karakter olmalıdır.' }),
        company: zod_1.z.string().optional(),
    }),
});
// New: use a saved Address by ID and snapshot it into draft.shipping
exports.setShippingAddressIdSchema = zod_1.z.object({
    addressId: zod_1.z.string().uuid({ message: 'Geçerli bir adres ID (UUID) giriniz.' }),
});
// ============ UPLOAD SCHEMAS ============
exports.presignUploadSchema = zod_1.z.object({
    contentType: zod_1.z
        .string()
        .min(3)
        .regex(/^[\w.-]+\/[\w.+-]+$/, { message: 'Geçersiz içerik tipi formatı.' })
        .optional(),
});
exports.uploadFileSchema = zod_1.z.object({
// no body fields; multipart file named "file"
});
// ============ WORKFLOW SCHEMAS ============
exports.sendPreviewSchema = zod_1.z.object({
    message: zod_1.z.string().optional(),
});
exports.requestRevisionSchema = zod_1.z.object({
    notes: zod_1.z.string()
        .min(10, { message: 'Revizyon notları en az 10 karakter olmalıdır.' })
        .max(500, { message: 'Revizyon notları en fazla 500 karakter olabilir.' })
        .optional(),
});
exports.approveDesignSchema = zod_1.z.object({
    rating: zod_1.z.number()
        .int({ message: 'Puan tam sayı olmalıdır.' })
        .min(1, { message: 'Puan en az 1 olmalıdır.' })
        .max(5, { message: 'Puan en fazla 5 olabilir.' })
        .optional(),
    comment: zod_1.z.string()
        .max(500, { message: 'Yorum en fazla 500 karakter olabilir.' })
        .optional(),
});
exports.cancelDraftSchema = zod_1.z.object({
    reason: zod_1.z.string()
        .min(5, { message: 'İptal nedeni en az 5 karakter olmalıdır.' })
        .max(200, { message: 'İptal nedeni en fazla 200 karakter olabilir.' })
        .optional(),
});
// ============ QUERY PARAMETER SCHEMAS ============
exports.listDraftsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20).optional(),
    status: zod_1.z.enum([
        'PENDING',
        'IN_PROGRESS',
        'PREVIEW_SENT',
        'REVISION',
        'COMPLETED',
        'CANCELED'
    ]).optional(),
    include: zod_1.z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt']).default('createdAt').optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc').optional(),
});
// ============ PARAMETER SCHEMAS ============
exports.draftIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir taslak ID (UUID) giriniz.' }),
});
// ============ COMBINED WORKFLOW ACTION SCHEMA ============
exports.workflowActionSchema = zod_1.z.discriminatedUnion('action', [
    zod_1.z.object({
        action: zod_1.z.literal('sendPreview'),
        message: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        action: zod_1.z.literal('requestRevision'),
        notes: zod_1.z.string().min(10).max(500).optional(),
    }),
    zod_1.z.object({
        action: zod_1.z.literal('approve'),
        rating: zod_1.z.number().int().min(1).max(5).optional(),
        comment: zod_1.z.string().max(500).optional(),
    }),
    zod_1.z.object({
        action: zod_1.z.literal('cancel'),
        reason: zod_1.z.string().min(5).max(200).optional(),
    }),
]);
// ============ VALIDATION HELPERS ============
exports.validatePhoneNumber = zod_1.z.string().refine((phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Turkish phone validation
    if (cleanPhone.startsWith('0'))
        return cleanPhone.length === 11;
    if (cleanPhone.startsWith('90'))
        return cleanPhone.length === 12;
    if (cleanPhone.startsWith('5'))
        return cleanPhone.length === 10;
    // International format
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
}, { message: 'Geçersiz telefon numarası formatı.' });
// Enhanced shipping schema with phone validation
exports.enhancedShippingSchema = zod_1.z.object({
    shipping: zod_1.z.object({
        senderName: zod_1.z.string()
            .min(1, { message: 'Gönderici adı boş olamaz.' })
            .max(100, { message: 'Gönderici adı en fazla 100 karakter olabilir.' }),
        senderPhone: exports.validatePhoneNumber,
        receiverName: zod_1.z.string()
            .min(1, { message: 'Alıcı adı boş olamaz.' })
            .max(100, { message: 'Alıcı adı en fazla 100 karakter olabilir.' }),
        receiverPhone: exports.validatePhoneNumber,
        city: zod_1.z.string()
            .min(1, { message: 'Şehir boş olamaz.' })
            .max(50, { message: 'Şehir adı en fazla 50 karakter olabilir.' }),
        district: zod_1.z.string()
            .min(1, { message: 'İlçe boş olamaz.' })
            .max(50, { message: 'İlçe adı en fazla 50 karakter olabilir.' }),
        address: zod_1.z.string()
            .min(5, { message: 'Adres en az 5 karakter olmalıdır.' })
            .max(250, { message: 'Adres en fazla 250 karakter olabilir.' }),
        company: zod_1.z.string()
            .max(100, { message: 'Firma adı en fazla 100 karakter olabilir.' })
            .optional(),
    }),
});
// ============ BILLING (INVOICE) ADDRESS SCHEMA ============
// Ephemeral billing address for checkout; not persisted in Address table
exports.setBillingAddressSchema = zod_1.z.object({
    sameAsShipping: zod_1.z.boolean().default(true),
    billing: zod_1.z.object({
        type: zod_1.z.enum(['personal', 'corporate']).default('personal'),
        firstName: zod_1.z.string().min(2).max(60),
        lastName: zod_1.z.string().min(2).max(60),
        phone: exports.validatePhoneNumber,
        city: zod_1.z.string().min(2).max(50),
        district: zod_1.z.string().min(2).max(50),
        address: zod_1.z.string().min(5).max(250),
        postalCode: zod_1.z.string().regex(/^\d{5}$/).optional(),
        country: zod_1.z.string().length(2).default('TR'),
        // Corporate fields
        taxNumber: zod_1.z.string().regex(/^\d{10,11}$/).optional(), // VKN(10)/TCKN(11)
        taxOffice: zod_1.z.string().max(80).optional(),
        companyName: zod_1.z.string().max(120).optional(),
    }).partial().refine((val) => {
        if (!val)
            return true;
        if (val.type === 'corporate') {
            return Boolean(val.taxNumber) && Boolean(val.taxOffice) && Boolean(val.companyName);
        }
        return true;
    }, { message: 'Kurumsal fatura için vergi no/daire ve firma adı zorunludur.' }),
});
// ============ RESPONSE SCHEMAS (for API documentation) ============
exports.draftResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    method: zod_1.z.enum(['upload', 'ai', 'artist']),
    step: zod_1.z.number(),
    workflowStatus: zod_1.z.enum([
        'PENDING',
        'IN_PROGRESS',
        'PREVIEW_SENT',
        'REVISION',
        'COMPLETED',
        'CANCELED'
    ]),
    revisionCount: zod_1.z.number(),
    maxRevisions: zod_1.z.number(),
    data: zod_1.z.any().nullable(),
    messageCardId: zod_1.z.string().uuid().nullable(),
    shipping: zod_1.z.any().nullable(),
    assignedDesignerId: zod_1.z.string().uuid().nullable(),
    committedAt: zod_1.z.date().nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.draftListResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.array(exports.draftResponseSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        total: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
exports.workflowHistoryResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        event: zod_1.z.string(),
        occurredAt: zod_1.z.date(),
        userId: zod_1.z.string().uuid(),
        metadata: zod_1.z.any().optional(),
    })),
});
exports.revisionDetailsResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.object({
        currentRevision: zod_1.z.number(),
        maxRevisions: zod_1.z.number(),
        remainingRevisions: zod_1.z.number(),
        history: zod_1.z.array(zod_1.z.object({
            revisionNumber: zod_1.z.number(),
            requestedAt: zod_1.z.date(),
            notes: zod_1.z.string().optional(),
        })),
    }),
});
// ============ ERROR RESPONSE SCHEMA ============
exports.errorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        message: zod_1.z.string(),
        code: zod_1.z.string().optional(),
        details: zod_1.z.any().optional(),
    }),
});
// ============ CONSTANTS ============
exports.DRAFT_METHODS = ['upload', 'ai', 'artist'];
exports.WORKFLOW_STATUSES = [
    'PENDING',
    'IN_PROGRESS',
    'PREVIEW_SENT',
    'REVISION',
    'COMPLETED',
    'CANCELED'
];
exports.MAX_REVISIONS = 3;
exports.MAX_UPLOAD_SIZE_MB = 100;
exports.ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf'
];
