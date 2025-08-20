import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';
import { notFound, badRequest } from '../../../shared/errors/ApiError';
import { env } from '../../../config/env';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

export class DraftService {
  async create(userId: string, method: 'upload' | 'ai' | 'artist') {
    return prisma.draft.create({ data: { userId, method } });
  }

  async list(userId: string) {
    return prisma.draft.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async get(id: string, actorId?: string) {
    const draft = await prisma.draft.findUnique({ where: { id } });
    if (!draft) throw notFound('Draft not found');
    if (actorId && draft.userId !== actorId) throw badRequest('Owner mismatch');
    return draft;
  }

  async update(id: string, params: { step?: number; data?: Record<string, unknown>; messageCardId?: string }, actorId?: string) {
    if (actorId) {
      const current = await prisma.draft.findUnique({ where: { id }, select: { userId: true } });
      if (!current) throw notFound('Draft not found');
      if (current.userId !== actorId) throw badRequest('Owner mismatch');
    }
    const draft = await prisma.draft.update({
      where: { id },
      data: {
        step: params.step,
        data: params.data as Prisma.InputJsonValue | undefined,
        messageCardId: params.messageCardId,
      },
    });
    return draft;
  }

  // Local upload path reservation: returns a file token and destination path (no file transfer here)
  async createUploadUrl(id: string, contentType?: string) {
    const ct = contentType && this.isAllowedContentType(contentType) ? contentType : 'application/octet-stream';
    const fileId = randomUUID();
    const ext = this.extensionForContentType(ct);
    const relKey = `drafts/${id}/${fileId}${ext}`;
    const absPath = path.join(env.UPLOAD_DIR, relKey);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    // For local upload, we don’t presign; client will upload via dedicated endpoint with multipart form
    return { url: `/api/drafts/${id}/upload`, method: 'POST' as const, key: relKey, contentType: ct, maxSizeMB: this.maxSizeMB() };
  }

  private isAllowedContentType(ct: string): boolean {
    const allow = env.UPLOAD_ALLOWED_MIME as string[];
    return allow.includes(ct);
  }

  private maxSizeMB(): number {
    return env.UPLOAD_MAX_SIZE_MB as number;
  }

  private extensionForContentType(ct: string): string {
    if (ct === 'image/png') return '.png';
    if (ct === 'image/jpeg') return '.jpg';
    if (ct === 'image/webp') return '.webp';
    if (ct === 'application/pdf') return '.pdf';
    return '';
  }

  async setMessageCard(id: string, params: { messageCardId: string; to?: string; signature?: string; content?: string }, actorId?: string) {
    if (actorId) {
      const current = await prisma.draft.findUnique({ where: { id }, select: { userId: true } });
      if (!current) throw notFound('Draft not found');
      if (current.userId !== actorId) throw badRequest('Owner mismatch');
    }
    await this.ensureMessageCardExists(params.messageCardId);
    const payload = { to: params.to, signature: params.signature, content: params.content } as Record<string, unknown>;
    return prisma.draft.update({ where: { id }, data: { messageCardId: params.messageCardId, data: payload as Prisma.InputJsonValue } });
  }

  async setShipping(id: string, shipping: Record<string, unknown>, actorId?: string) {
    if (actorId) {
      const current = await prisma.draft.findUnique({ where: { id }, select: { userId: true } });
      if (!current) throw notFound('Draft not found');
      if (current.userId !== actorId) throw badRequest('Owner mismatch');
    }
    return prisma.draft.update({ where: { id }, data: { shipping: shipping as Prisma.InputJsonValue } });
  }

  async commit(id: string, userId: string) {
    const draft = await prisma.draft.findUnique({ where: { id } });
    if (!draft) throw notFound('Draft not found');
    if (draft.userId !== userId) throw badRequest('Owner mismatch');
    // Basit fiyat: kart fiyatı + kargo sabit 30 TL örn.
    const card = draft.messageCardId ? await prisma.messageCard.findUnique({ where: { id: draft.messageCardId } }) : null;
    const totalCents = (card?.priceCents ?? 0) + 3000;

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: { userId, totalCents, currency: 'TRY' } });
      await tx.orderItem.create({ data: { orderId: order.id, type: 'draft', referenceId: draft.id, unitPriceCents: totalCents, quantity: 1 } });
      await tx.draft.update({ where: { id }, data: { committedAt: new Date() } });
      return order;
    });
  }

  private async ensureMessageCardExists(id: string) {
    const exists = await prisma.messageCard.findUnique({ where: { id } });
    if (!exists) throw badRequest('Invalid messageCardId');
  }
}


