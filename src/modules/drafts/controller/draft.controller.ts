import { Request, Response } from 'express';
import { DraftService } from '../service/draft.service';
import { presignUploadSchema, assignDesignerSchema } from '../dto/draft.dto';
import path from 'path';
import fs from 'fs/promises';

const service = new DraftService();

export async function createDraftController(req: Request, res: Response) {
  const userId = req.user!.id;
  const draft = await service.create(userId, req.body.method);
  res.status(201).json(draft);
}

export async function getMyDraftsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const drafts = await service.list(userId);
  res.status(200).json(drafts);
}

export async function getDraftController(req: Request, res: Response) {
  const id = req.params.id as string;
  const draft = await service.get(id, req.user!.id);
  res.status(200).json(draft);
}

export async function updateDraftController(req: Request, res: Response) {
  const id = req.params.id as string;
  const draft = await service.update(id, req.body, req.user!.id);
  res.status(200).json(draft);
}

export async function uploadPresignController(req: Request, res: Response) {
  const id = req.params.id as string;
  const { contentType } = presignUploadSchema.parse(req.body);
  const signed = await service.createUploadUrl(id, contentType);
  res.status(200).json(signed);
}

// Local multipart upload endpoint
export async function uploadFileController(req: Request, res: Response) {
  const id = req.params.id as string;
  await service.get(id, req.user!.id);
  // File saved by middleware; expose relative key for DB usage
  const fileRelPath = req.fileRelPath as string | undefined;
  if (!fileRelPath) return res.status(400).json({ message: 'Upload failed' });
  res.status(201).json({ key: fileRelPath, url: path.posix.join('/uploads', fileRelPath.replace(/\\/g, '/')) });
}

export async function setMessageCardController(req: Request, res: Response) {
  const id = req.params.id as string;
  const draft = await service.setMessageCard(id, req.body, req.user!.id);
  res.status(200).json(draft);
}

export async function setShippingController(req: Request, res: Response) {
  const id = req.params.id as string;
  const draft = await service.setShipping(id, req.body.shipping, req.user!.id);
  res.status(200).json(draft);
}

export async function commitDraftController(req: Request, res: Response) {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const order = await service.commit(id, userId);
  res.status(201).json(order);
}

export async function assignDesignerController(req: Request, res: Response) {
  const id = req.params.id as string;
  const { designerId } = assignDesignerSchema.parse(req.body);
  const draft = await service.assignDesigner(id, designerId, req.user!.id);
  res.status(200).json(draft);
}


