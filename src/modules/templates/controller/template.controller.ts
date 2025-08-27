import { Request, Response } from 'express';
import { TemplateService } from '../service/template.service';
import { listTemplatesSchema, createTemplateSchema, updateTemplateSchema } from '../dto/template.dto';

const templateService = new TemplateService();

export async function listTemplatesController(req: Request, res: Response) {
  const params = listTemplatesSchema.parse(req.query);
  const result = await templateService.list(params);
  res.status(200).json(result);
}

export async function getTemplateBySlugController(req: Request, res: Response) {
  const { slug } = req.params as { slug: string };
  const template = await templateService.getBySlug(slug);
  res.status(200).json(template);
}

export async function getTemplateByIdController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const template = await templateService.getById(id);
  res.status(200).json(template);
}

export async function createTemplateController(req: Request, res: Response) {
  const data = createTemplateSchema.parse(req.body);
  const authorId = req.user?.id; // Optional author
  const template = await templateService.create(data, authorId);
  res.status(201).json(template);
}

export async function updateTemplateController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const data = updateTemplateSchema.parse(req.body);
  const template = await templateService.update(id, data);
  res.status(200).json(template);
}

export async function deleteTemplateController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await templateService.delete(id);
  res.status(204).send();
}

export async function getPopularTemplatesController(_req: Request, res: Response) {
  const templates = await templateService.getPopular(12);
  res.status(200).json(templates);
}
