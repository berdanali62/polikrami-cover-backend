import { z } from 'zod';
export declare const createDraftSchema: z.ZodObject<{
    method: z.ZodEnum<["upload", "ai", "artist"]>;
}, "strip", z.ZodTypeAny, {
    method: "ai" | "upload" | "artist";
}, {
    method: "ai" | "upload" | "artist";
}>;
export declare const updateDraftSchema: z.ZodObject<{
    step: z.ZodOptional<z.ZodNumber>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    messageCardId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    step?: number | undefined;
    data?: Record<string, any> | undefined;
    messageCardId?: string | undefined;
}, {
    step?: number | undefined;
    data?: Record<string, any> | undefined;
    messageCardId?: string | undefined;
}>;
export declare const assignDesignerSchema: z.ZodObject<{
    designerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    designerId: string;
}, {
    designerId: string;
}>;
export declare const setMessageCardSchema: z.ZodObject<{
    messageCardId: z.ZodString;
    to: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    messageCardId: string;
    to?: string | undefined;
    signature?: string | undefined;
    content?: string | undefined;
}, {
    messageCardId: string;
    to?: string | undefined;
    signature?: string | undefined;
    content?: string | undefined;
}>;
export declare const setShippingSchema: z.ZodObject<{
    shipping: z.ZodObject<{
        senderName: z.ZodString;
        senderPhone: z.ZodString;
        receiverName: z.ZodString;
        receiverPhone: z.ZodString;
        city: z.ZodString;
        district: z.ZodString;
        address: z.ZodString;
        company: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    }, {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    shipping: {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    };
}, {
    shipping: {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    };
}>;
export declare const setShippingAddressIdSchema: z.ZodObject<{
    addressId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    addressId: string;
}, {
    addressId: string;
}>;
export declare const presignUploadSchema: z.ZodObject<{
    contentType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contentType?: string | undefined;
}, {
    contentType?: string | undefined;
}>;
export declare const uploadFileSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const sendPreviewSchema: z.ZodObject<{
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string | undefined;
}, {
    message?: string | undefined;
}>;
export declare const requestRevisionSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export declare const approveDesignSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    comment?: string | undefined;
    rating?: number | undefined;
}, {
    comment?: string | undefined;
    rating?: number | undefined;
}>;
export declare const cancelDraftSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const listDraftsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "IN_PROGRESS", "PREVIEW_SENT", "REVISION", "COMPLETED", "CANCELED"]>>;
    include: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
    sortBy: z.ZodOptional<z.ZodDefault<z.ZodEnum<["createdAt", "updatedAt"]>>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED" | undefined;
    include?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "updatedAt" | "createdAt" | undefined;
    sortOrder?: "desc" | "asc" | undefined;
}, {
    status?: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED" | undefined;
    include?: "true" | "false" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "updatedAt" | "createdAt" | undefined;
    sortOrder?: "desc" | "asc" | undefined;
}>;
export declare const draftIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const workflowActionSchema: z.ZodDiscriminatedUnion<"action", [z.ZodObject<{
    action: z.ZodLiteral<"sendPreview">;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "sendPreview";
    message?: string | undefined;
}, {
    action: "sendPreview";
    message?: string | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"requestRevision">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "requestRevision";
    notes?: string | undefined;
}, {
    action: "requestRevision";
    notes?: string | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"approve">;
    rating: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "approve";
    comment?: string | undefined;
    rating?: number | undefined;
}, {
    action: "approve";
    comment?: string | undefined;
    rating?: number | undefined;
}>, z.ZodObject<{
    action: z.ZodLiteral<"cancel">;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "cancel";
    reason?: string | undefined;
}, {
    action: "cancel";
    reason?: string | undefined;
}>]>;
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
export declare const validatePhoneNumber: z.ZodEffects<z.ZodString, string, string>;
export declare const enhancedShippingSchema: z.ZodObject<{
    shipping: z.ZodObject<{
        senderName: z.ZodString;
        senderPhone: z.ZodEffects<z.ZodString, string, string>;
        receiverName: z.ZodString;
        receiverPhone: z.ZodEffects<z.ZodString, string, string>;
        city: z.ZodString;
        district: z.ZodString;
        address: z.ZodString;
        company: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    }, {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    shipping: {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    };
}, {
    shipping: {
        address: string;
        city: string;
        district: string;
        senderName: string;
        senderPhone: string;
        receiverName: string;
        receiverPhone: string;
        company?: string | undefined;
    };
}>;
export declare const setBillingAddressSchema: z.ZodObject<{
    sameAsShipping: z.ZodDefault<z.ZodBoolean>;
    billing: z.ZodEffects<z.ZodObject<{
        type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["personal", "corporate"]>>>;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        city: z.ZodOptional<z.ZodString>;
        district: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        country: z.ZodOptional<z.ZodDefault<z.ZodString>>;
        taxNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        taxOffice: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        companyName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type?: "personal" | "corporate" | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        city?: string | undefined;
        district?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        taxNumber?: string | undefined;
        taxOffice?: string | undefined;
        companyName?: string | undefined;
    }, {
        type?: "personal" | "corporate" | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        city?: string | undefined;
        district?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        taxNumber?: string | undefined;
        taxOffice?: string | undefined;
        companyName?: string | undefined;
    }>, {
        type?: "personal" | "corporate" | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        city?: string | undefined;
        district?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        taxNumber?: string | undefined;
        taxOffice?: string | undefined;
        companyName?: string | undefined;
    }, {
        type?: "personal" | "corporate" | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        city?: string | undefined;
        district?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        taxNumber?: string | undefined;
        taxOffice?: string | undefined;
        companyName?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    sameAsShipping: boolean;
    billing: {
        type?: "personal" | "corporate" | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        city?: string | undefined;
        district?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        taxNumber?: string | undefined;
        taxOffice?: string | undefined;
        companyName?: string | undefined;
    };
}, {
    billing: {
        type?: "personal" | "corporate" | undefined;
        address?: string | undefined;
        phone?: string | undefined;
        city?: string | undefined;
        district?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        taxNumber?: string | undefined;
        taxOffice?: string | undefined;
        companyName?: string | undefined;
    };
    sameAsShipping?: boolean | undefined;
}>;
export declare const draftResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    method: z.ZodEnum<["upload", "ai", "artist"]>;
    step: z.ZodNumber;
    workflowStatus: z.ZodEnum<["PENDING", "IN_PROGRESS", "PREVIEW_SENT", "REVISION", "COMPLETED", "CANCELED"]>;
    revisionCount: z.ZodNumber;
    maxRevisions: z.ZodNumber;
    data: z.ZodNullable<z.ZodAny>;
    messageCardId: z.ZodNullable<z.ZodString>;
    shipping: z.ZodNullable<z.ZodAny>;
    assignedDesignerId: z.ZodNullable<z.ZodString>;
    committedAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    userId: string;
    updatedAt: Date;
    id: string;
    method: "ai" | "upload" | "artist";
    step: number;
    messageCardId: string | null;
    committedAt: Date | null;
    createdAt: Date;
    workflowStatus: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED";
    revisionCount: number;
    maxRevisions: number;
    assignedDesignerId: string | null;
    data?: any;
    shipping?: any;
}, {
    userId: string;
    updatedAt: Date;
    id: string;
    method: "ai" | "upload" | "artist";
    step: number;
    messageCardId: string | null;
    committedAt: Date | null;
    createdAt: Date;
    workflowStatus: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED";
    revisionCount: number;
    maxRevisions: number;
    assignedDesignerId: string | null;
    data?: any;
    shipping?: any;
}>;
export declare const draftListResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        method: z.ZodEnum<["upload", "ai", "artist"]>;
        step: z.ZodNumber;
        workflowStatus: z.ZodEnum<["PENDING", "IN_PROGRESS", "PREVIEW_SENT", "REVISION", "COMPLETED", "CANCELED"]>;
        revisionCount: z.ZodNumber;
        maxRevisions: z.ZodNumber;
        data: z.ZodNullable<z.ZodAny>;
        messageCardId: z.ZodNullable<z.ZodString>;
        shipping: z.ZodNullable<z.ZodAny>;
        assignedDesignerId: z.ZodNullable<z.ZodString>;
        committedAt: z.ZodNullable<z.ZodDate>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        updatedAt: Date;
        id: string;
        method: "ai" | "upload" | "artist";
        step: number;
        messageCardId: string | null;
        committedAt: Date | null;
        createdAt: Date;
        workflowStatus: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED";
        revisionCount: number;
        maxRevisions: number;
        assignedDesignerId: string | null;
        data?: any;
        shipping?: any;
    }, {
        userId: string;
        updatedAt: Date;
        id: string;
        method: "ai" | "upload" | "artist";
        step: number;
        messageCardId: string | null;
        committedAt: Date | null;
        createdAt: Date;
        workflowStatus: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED";
        revisionCount: number;
        maxRevisions: number;
        assignedDesignerId: string | null;
        data?: any;
        shipping?: any;
    }>, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        userId: string;
        updatedAt: Date;
        id: string;
        method: "ai" | "upload" | "artist";
        step: number;
        messageCardId: string | null;
        committedAt: Date | null;
        createdAt: Date;
        workflowStatus: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED";
        revisionCount: number;
        maxRevisions: number;
        assignedDesignerId: string | null;
        data?: any;
        shipping?: any;
    }[];
    success: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}, {
    data: {
        userId: string;
        updatedAt: Date;
        id: string;
        method: "ai" | "upload" | "artist";
        step: number;
        messageCardId: string | null;
        committedAt: Date | null;
        createdAt: Date;
        workflowStatus: "PENDING" | "IN_PROGRESS" | "PREVIEW_SENT" | "REVISION" | "COMPLETED" | "CANCELED";
        revisionCount: number;
        maxRevisions: number;
        assignedDesignerId: string | null;
        data?: any;
        shipping?: any;
    }[];
    success: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const workflowHistoryResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        event: z.ZodString;
        occurredAt: z.ZodDate;
        userId: z.ZodString;
        metadata: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        event: string;
        userId: string;
        id: string;
        occurredAt: Date;
        metadata?: any;
    }, {
        event: string;
        userId: string;
        id: string;
        occurredAt: Date;
        metadata?: any;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data: {
        event: string;
        userId: string;
        id: string;
        occurredAt: Date;
        metadata?: any;
    }[];
    success: boolean;
}, {
    data: {
        event: string;
        userId: string;
        id: string;
        occurredAt: Date;
        metadata?: any;
    }[];
    success: boolean;
}>;
export declare const revisionDetailsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodObject<{
        currentRevision: z.ZodNumber;
        maxRevisions: z.ZodNumber;
        remainingRevisions: z.ZodNumber;
        history: z.ZodArray<z.ZodObject<{
            revisionNumber: z.ZodNumber;
            requestedAt: z.ZodDate;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            revisionNumber: number;
            requestedAt: Date;
            notes?: string | undefined;
        }, {
            revisionNumber: number;
            requestedAt: Date;
            notes?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        maxRevisions: number;
        currentRevision: number;
        remainingRevisions: number;
        history: {
            revisionNumber: number;
            requestedAt: Date;
            notes?: string | undefined;
        }[];
    }, {
        maxRevisions: number;
        currentRevision: number;
        remainingRevisions: number;
        history: {
            revisionNumber: number;
            requestedAt: Date;
            notes?: string | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        maxRevisions: number;
        currentRevision: number;
        remainingRevisions: number;
        history: {
            revisionNumber: number;
            requestedAt: Date;
            notes?: string | undefined;
        }[];
    };
    success: boolean;
}, {
    data: {
        maxRevisions: number;
        currentRevision: number;
        remainingRevisions: number;
        history: {
            revisionNumber: number;
            requestedAt: Date;
            notes?: string | undefined;
        }[];
    };
    success: boolean;
}>;
export declare const errorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code?: string | undefined;
        details?: any;
    }, {
        message: string;
        code?: string | undefined;
        details?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        code?: string | undefined;
        details?: any;
    };
    success: false;
}, {
    error: {
        message: string;
        code?: string | undefined;
        details?: any;
    };
    success: false;
}>;
export declare const DRAFT_METHODS: readonly ["upload", "ai", "artist"];
export declare const WORKFLOW_STATUSES: readonly ["PENDING", "IN_PROGRESS", "PREVIEW_SENT", "REVISION", "COMPLETED", "CANCELED"];
export declare const MAX_REVISIONS = 3;
export declare const MAX_UPLOAD_SIZE_MB = 100;
export declare const ALLOWED_MIME_TYPES: readonly ["image/png", "image/jpeg", "image/webp", "application/pdf"];
