import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';
import { notFound, badRequest } from '../../../shared/errors/ApiError';
import { env } from '../../../config/env';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

interface ShippingData {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  city: string;
  district: string;
  address: string;
  company?: string;
}

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
    const data: Prisma.DraftUpdateInput = {
      step: params.step as number | undefined,
      data: (params.data as Prisma.InputJsonValue | undefined) ?? undefined,
      messageCard: params.messageCardId ? { connect: { id: params.messageCardId } } : undefined,
    };
    const draft = await prisma.draft.update({ where: { id }, data });
    return draft;
  }

  async assignDesigner(id: string, designerId: string, actorId?: string) {
    if (actorId) {
      const current = await prisma.draft.findUnique({ where: { id }, select: { userId: true } });
      if (!current) throw notFound('Draft not found');
      if (current.userId !== actorId) throw badRequest('Owner mismatch');
    }
    // Ensure designer exists and has role 'designer'
    const designer = await prisma.user.findFirst({ where: { id: designerId, roles: { some: { role: { name: 'designer' } } } }, select: { id: true } });
    if (!designer) throw notFound('Designer not found');
    return prisma.draft.update({ where: { id }, data: { assignedDesignerId: designerId } as unknown as Prisma.DraftUncheckedUpdateInput });
  }

  // Local upload path reservation: returns a file token and destination path (no file transfer here)
  async createUploadUrl(id: string, contentType?: string) {
    const ct = contentType && this.isAllowedContentType(contentType) ? contentType : 'application/octet-stream';
    const fileId = randomUUID();
    const ext = this.extensionForContentType(ct);
    const relKey = `drafts/${id}/${fileId}${ext}`;
    const absPath = path.join(env.UPLOAD_PUBLIC_DIR, relKey);
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

  async setShipping(id: string, shipping: ShippingData, actorId?: string) {
    if (actorId) {
      const current = await prisma.draft.findUnique({ where: { id }, select: { userId: true } });
      if (!current) throw notFound('Draft not found');
      if (current.userId !== actorId) throw badRequest('Owner mismatch');
    }
    return prisma.draft.update({ where: { id }, data: { shipping: shipping as unknown as Prisma.InputJsonValue } });
  }

  async commit(id: string, userId: string) {
    const draft = await prisma.draft.findUnique({ where: { id } });
    if (!draft) throw notFound('Draft not found');
    if (draft.userId !== userId) throw badRequest('Owner mismatch');
    // Calculate total price: card price + shipping cost from config
    const card = draft.messageCardId ? await prisma.messageCard.findUnique({ where: { id: draft.messageCardId } }) : null;
    const totalCents = (card?.priceCents ?? 0) + env.SHIPPING_COST_CENTS;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({ data: { userId, totalCents, currency: 'TRY' } });
      await tx.orderItem.create({ data: { orderId: createdOrder.id, type: 'draft', referenceId: draft.id, unitPriceCents: totalCents, quantity: 1 } });
      await tx.draft.update({ where: { id }, data: { committedAt: new Date() } });
      // Notify assigned designer if exists (using type-safe query)
      try {
        const draftWithDesigner = await tx.draft.findUnique({
          where: { id },
          include: { assignedDesigner: { select: { email: true } } }
        });
        const email = draftWithDesigner?.assignedDesigner?.email;
        if (email) {
          const { sendEmail } = await import('../../../shared/email/mailer');
          await sendEmail({ to: email, subject: 'Yeni İş Atandı', text: `Yeni bir tasarım işi atandı. Draft ID: ${id}` });
        }
      } catch (error) {
        const { logger } = await import('../../../utils/logger');
        logger.error({ error, draftId: id }, 'Failed to notify assigned designer');
      }
      return createdOrder;
    });

    // Auto-create shipment after commit (best-effort, non-blocking)
    try {
      const { ShipmentService } = await import('../../shipments/service/ShipmentService');
      const svc = new ShipmentService();
      const shipping = (draft.shipping as unknown as { carrierCode?: string; carrierName?: string; trackingNumber?: string } | null) || null;
      const hasCarrier = typeof shipping?.carrierCode === 'string' && shipping.carrierCode.length > 0;
      const hasTracking = typeof shipping?.trackingNumber === 'string' && shipping.trackingNumber.length > 0;
      if (hasCarrier && hasTracking) {
        await svc.createAndRegisterShipment({ orderId: order.id, carrierCode: shipping!.carrierCode!, carrierName: shipping!.carrierName, trackingNumber: shipping!.trackingNumber! });
      }
    } catch (e) {
      const { logger } = await import('../../../utils/logger');
      logger.error({ e, draftId: id }, 'Auto-shipment create failed');
    }

    return order;
  }

  private async ensureMessageCardExists(id: string) {
    const exists = await prisma.messageCard.findUnique({ where: { id } });
    if (!exists) throw badRequest('Invalid messageCardId');
  }

}


