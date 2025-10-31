"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDesignerController = exports.commitDraftController = exports.setShippingController = exports.setMessageCardController = exports.uploadFileController = exports.uploadPresignController = exports.updateDraftController = exports.getDraftController = exports.getMyDraftsController = exports.createDraftController = exports.DraftController = void 0;
const draft_service_1 = require("../service/draft.service");
const draft_workflow_service_1 = require("../service/draft-workflow.service");
const ApiError_1 = require("../../../shared/errors/ApiError");
const logger_1 = require("../../../utils/logger");
const env_1 = require("../../../config/env");
class DraftController {
    draftService;
    workflowService;
    constructor(draftService = new draft_service_1.DraftService(), workflowService = new draft_workflow_service_1.DraftWorkflowService()) {
        this.draftService = draftService;
        this.workflowService = workflowService;
    }
    async create(req, res) {
        const userId = req.user.id;
        const { method } = req.body;
        const draft = await this.draftService.create(userId, { method });
        logger_1.logger.info({ userId, draftId: draft.id, method }, 'Draft created');
        res.status(201).json({ success: true, data: draft });
    }
    async list(req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const includeRelations = req.query.include === 'true';
        const result = await this.draftService.list(userId, { page, limit, includeRelations });
        res.status(200).json({ success: true, data: result });
    }
    async get(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const draft = await this.draftService.get(draftId, userId);
        res.status(200).json({ success: true, data: draft });
    }
    async update(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const updateData = req.body;
        const draft = await this.draftService.update(draftId, updateData, userId);
        logger_1.logger.info({ userId, draftId, updateData }, 'Draft updated');
        res.status(200).json({ success: true, data: draft });
    }
    async getUploadUrl(req, res) {
        const draftId = req.params.id;
        const { contentType } = req.body;
        const uploadData = await this.draftService.getUploadUrl(draftId, contentType);
        res.status(200).json({ success: true, data: uploadData });
    }
    async uploadFile(req, res) {
        const draftId = req.params.id;
        const file = req.file;
        if (!file)
            throw (0, ApiError_1.badRequest)('No file provided');
        const fileRelPath = req.fileRelPath;
        if (!fileRelPath)
            throw (0, ApiError_1.badRequest)('Upload failed');
        const publicUrl = `/uploads/${fileRelPath.replace(/\\/g, '/')}`;
        logger_1.logger.info({ draftId, fileName: file.originalname, fileSize: file.size, mimeType: file.mimetype }, 'File uploaded');
        res.status(201).json({ success: true, data: { key: fileRelPath, url: publicUrl } });
    }
    async setMessageCard(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const messageCardData = req.body;
        const draft = await this.draftService.setMessageCard(draftId, messageCardData, userId);
        logger_1.logger.info({ userId, draftId, messageCardId: messageCardData.messageCardId }, 'Message card set');
        res.status(200).json({ success: true, data: draft });
    }
    async setShipping(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const { shipping } = req.body;
        const draft = await this.draftService.setShipping(draftId, shipping, userId);
        logger_1.logger.info({ userId, draftId }, 'Shipping info set');
        res.status(200).json({ success: true, data: draft });
    }
    async setShippingFromAddress(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const { addressId } = req.body;
        const draft = await this.draftService.setShippingFromAddressId(draftId, addressId, userId);
        logger_1.logger.info({ userId, draftId, addressId }, 'Shipping info set from address');
        res.status(200).json({ success: true, data: draft });
    }
    async setBillingAddress(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const payload = req.body;
        const draft = await this.draftService.setBillingAddress(draftId, payload, userId);
        logger_1.logger.info({ userId, draftId, sameAsShipping: payload?.sameAsShipping }, 'Billing info set');
        res.status(200).json({ success: true, data: draft });
    }
    async assignDesigner(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const { designerId } = req.body;
        const draft = await this.draftService.assignDesigner(draftId, designerId, userId);
        logger_1.logger.info({ userId, draftId, designerId }, 'Designer assigned');
        res.status(200).json({ success: true, data: draft });
    }
    async commit(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const order = await this.draftService.commit(draftId, userId);
        logger_1.logger.info({ userId, draftId, orderId: order.id }, 'Draft committed');
        res.status(201).json({ success: true, data: order });
    }
    async sendPreview(req, res) {
        const draftId = req.params.id;
        const designerId = req.user.id;
        const draft = await this.workflowService.sendPreview(draftId, designerId);
        logger_1.logger.info({ designerId, draftId }, 'Preview sent');
        res.status(200).json({ success: true, data: draft });
    }
    async requestRevision(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const { notes } = req.body;
        const draft = await this.workflowService.requestRevision(draftId, userId, notes);
        logger_1.logger.info({ userId, draftId, revisionCount: draft.revisionCount }, 'Revision requested');
        res.status(200).json({
            success: true,
            data: draft,
            meta: {
                revisionCount: draft.revisionCount,
                maxRevisions: draft.maxRevisions || env_1.env.MAX_DRAFT_REVISIONS,
                remainingRevisions: Math.max(0, (draft.maxRevisions || env_1.env.MAX_DRAFT_REVISIONS) - (draft.revisionCount || 0))
            }
        });
    }
    async approve(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const draft = await this.workflowService.approve(draftId, userId);
        logger_1.logger.info({ userId, draftId }, 'Design approved');
        res.status(200).json({ success: true, data: draft });
    }
    async cancel(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        const { reason } = req.body;
        const draft = await this.workflowService.cancel(draftId, userId, reason);
        logger_1.logger.info({ userId, draftId, reason }, 'Draft cancelled');
        res.status(200).json({ success: true, data: draft });
    }
    async getWorkflowHistory(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        await this.draftService.get(draftId, userId);
        const history = await this.workflowService.getWorkflowHistory(draftId);
        res.status(200).json({ success: true, data: history });
    }
    async getRevisionDetails(req, res) {
        const draftId = req.params.id;
        const userId = req.user.id;
        await this.draftService.get(draftId, userId);
        const revisions = await this.workflowService.getRevisionDetails(draftId);
        res.status(200).json({ success: true, data: revisions });
    }
}
exports.DraftController = DraftController;
const controller = new DraftController();
exports.createDraftController = controller.create.bind(controller);
exports.getMyDraftsController = controller.list.bind(controller);
exports.getDraftController = controller.get.bind(controller);
exports.updateDraftController = controller.update.bind(controller);
exports.uploadPresignController = controller.getUploadUrl.bind(controller);
exports.uploadFileController = controller.uploadFile.bind(controller);
exports.setMessageCardController = controller.setMessageCard.bind(controller);
exports.setShippingController = controller.setShipping.bind(controller);
exports.commitDraftController = controller.commit.bind(controller);
exports.assignDesignerController = controller.assignDesigner.bind(controller);
