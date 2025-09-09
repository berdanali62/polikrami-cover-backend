import { Request, Response } from 'express';
import { TEMPLATES } from '../templates/templates';

export async function listTemplatesController(_req: Request, res: Response) {
  const list = TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    ratio: t.ratio,
    fields: t.fields,
  }));
  res.status(200).json({ templates: list });
}

export async function renderTemplateController(req: Request, res: Response) {
  const { templateId, fields } = req.body as { templateId: string; fields: Record<string, unknown> };
  const tpl = TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return res.status(404).json({ message: 'Template not found' });
  const finalPrompt = tpl.render(fields || {});
  res.status(200).json({
    finalPrompt,
    negativePrompt: tpl.defaults.negative,
    params: tpl.defaults.params,
  });
}


