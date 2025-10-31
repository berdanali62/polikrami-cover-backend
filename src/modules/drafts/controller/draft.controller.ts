import { Request, Response } from 'express';
import { DraftService } from '../service/draft.service';
import { DraftWorkflowService } from '../service/draft-workflow.service';
import { badRequest } from '../../../shared/errors/ApiError';
import { logger } from '../../../utils/logger';
import { env } from '../../../config/env';

export class DraftController {
  constructor(
    private readonly draftService = new DraftService(),
    private readonly workflowService = new DraftWorkflowService()
  ) {}

  async create(req: Request, res: Response) {
    const userId = req.user!.id;
    const { method } = req.body;
    const draft = await this.draftService.create(userId, { method });
    logger.info({ userId, draftId: draft.id, method }, 'Draft created');
    res.status(201).json({ success: true, data: draft });
  }

  async list(req: Request, res: Response) {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const includeRelations = req.query.include === 'true';
    const result = await this.draftService.list(userId, { page, limit, includeRelations });
    res.status(200).json({ success: true, data: result });
  }

  async get(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const draft = await this.draftService.get(draftId, userId);
    res.status(200).json({ success: true, data: draft });
  }

  async update(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const updateData = req.body;
    const draft = await this.draftService.update(draftId, updateData, userId);
    logger.info({ userId, draftId, updateData }, 'Draft updated');
    res.status(200).json({ success: true, data: draft });
  }

  async getUploadUrl(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const { contentType } = req.body;
    const uploadData = await this.draftService.getUploadUrl(draftId, contentType);
    res.status(200).json({ success: true, data: uploadData });
  }

  async uploadFile(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const file = req.file;
    if (!file) throw badRequest('No file provided');
    const fileRelPath = req.fileRelPath as string | undefined;
    if (!fileRelPath) throw badRequest('Upload failed');
    const publicUrl = `/uploads/${fileRelPath.replace(/\\/g, '/')}`;
    logger.info({ draftId, fileName: file.originalname, fileSize: file.size, mimeType: file.mimetype }, 'File uploaded');
    res.status(201).json({ success: true, data: { key: fileRelPath, url: publicUrl } });
  }

  async setMessageCard(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const messageCardData = req.body;
    const draft = await this.draftService.setMessageCard(draftId, messageCardData, userId);
    logger.info({ userId, draftId, messageCardId: messageCardData.messageCardId }, 'Message card set');
    res.status(200).json({ success: true, data: draft });
  }

  async setShipping(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const { shipping } = req.body;
    const draft = await this.draftService.setShipping(draftId, shipping, userId);
    logger.info({ userId, draftId }, 'Shipping info set');
    res.status(200).json({ success: true, data: draft });
  }

  async setShippingFromAddress(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const { addressId } = req.body as { addressId: string };
    const draft = await this.draftService.setShippingFromAddressId(draftId, addressId, userId);
    logger.info({ userId, draftId, addressId }, 'Shipping info set from address');
    res.status(200).json({ success: true, data: draft });
  }

  async setBillingAddress(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const payload = req.body as { sameAsShipping?: boolean; billing?: Record<string, unknown> };
    const draft = await this.draftService.setBillingAddress(draftId, payload, userId);
    logger.info({ userId, draftId, sameAsShipping: payload?.sameAsShipping }, 'Billing info set');
    res.status(200).json({ success: true, data: draft });
  }

  async assignDesigner(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const { designerId } = req.body;
    const draft = await this.draftService.assignDesigner(draftId, designerId, userId);
    logger.info({ userId, draftId, designerId }, 'Designer assigned');
    res.status(200).json({ success: true, data: draft });
  }

  async commit(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const order = await this.draftService.commit(draftId, userId);
    logger.info({ userId, draftId, orderId: order.id }, 'Draft committed');
    res.status(201).json({ success: true, data: order });
  }

  async sendPreview(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const designerId = req.user!.id;
    const draft = await this.workflowService.sendPreview(draftId, designerId);
    logger.info({ designerId, draftId }, 'Preview sent');
    res.status(200).json({ success: true, data: draft });
  }

  async requestRevision(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const { notes } = req.body;
    const draft = await this.workflowService.requestRevision(draftId, userId, notes);
    logger.info({ userId, draftId, revisionCount: draft.revisionCount }, 'Revision requested');
    res.status(200).json({
      success: true,
      data: draft,
      meta: {
        revisionCount: draft.revisionCount,
        maxRevisions: draft.maxRevisions || env.MAX_DRAFT_REVISIONS,
        remainingRevisions: Math.max(0, (draft.maxRevisions || env.MAX_DRAFT_REVISIONS) - (draft.revisionCount || 0))
      }
    });
  }

  async approve(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const draft = await this.workflowService.approve(draftId, userId);
    logger.info({ userId, draftId }, 'Design approved');
    res.status(200).json({ success: true, data: draft });
  }

  async cancel(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    const { reason } = req.body;
    const draft = await this.workflowService.cancel(draftId, userId, reason);
    logger.info({ userId, draftId, reason }, 'Draft cancelled');
    res.status(200).json({ success: true, data: draft });
  }

  async getWorkflowHistory(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    await this.draftService.get(draftId, userId);
    const history = await this.workflowService.getWorkflowHistory(draftId);
    res.status(200).json({ success: true, data: history });
  }

  async getRevisionDetails(req: Request, res: Response) {
    const draftId = req.params.id as string;
    const userId = req.user!.id;
    await this.draftService.get(draftId, userId);
    const revisions = await this.workflowService.getRevisionDetails(draftId);
    res.status(200).json({ success: true, data: revisions });
  }
}

const controller = new DraftController();
export const createDraftController = controller.create.bind(controller);
export const getMyDraftsController = controller.list.bind(controller);
export const getDraftController = controller.get.bind(controller);
export const updateDraftController = controller.update.bind(controller);
export const uploadPresignController = controller.getUploadUrl.bind(controller);
export const uploadFileController = controller.uploadFile.bind(controller);
export const setMessageCardController = controller.setMessageCard.bind(controller);
export const setShippingController = controller.setShipping.bind(controller);
export const commitDraftController = controller.commit.bind(controller);
export const assignDesignerController = controller.assignDesigner.bind(controller);
