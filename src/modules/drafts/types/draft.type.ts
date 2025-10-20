// src/modules/drafts/types/draft.types.ts
import { Draft, MessageCard, User, WorkflowStatus } from '@prisma/client';

export interface CreateDraftInput {
  method: 'upload' | 'ai' | 'artist';
}

export interface UpdateDraftInput {
  step?: number;
  data?: Record<string, unknown>;
  messageCardId?: string;
}

export interface SetMessageCardInput {
  messageCardId: string;
  to?: string;
  signature?: string;
  content?: string;
}

export interface SetShippingInput {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  city: string;
  district: string;
  address: string;
  company?: string;
}

export interface AssignDesignerInput {
  designerId: string;
}

export interface DraftWithRelations extends Draft {
  user?: Pick<User, 'id' | 'name' | 'email'>;
  messageCard?: MessageCard | null;
  assignedDesigner?: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface DraftListResponse {
  data: Draft[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkflowAction {
  action: 'sendPreview' | 'requestRevision' | 'approve' | 'cancel';
  notes?: string;
  reason?: string;
}