import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validateBody, validateParams } from '../../middlewares/validation';
import { z } from 'zod';
import { generateController, resultsController, selectController, regenController } from './controller/ai.controller';
import { listTemplatesController, renderTemplateController } from './controller/prompt.controller';
import { generateSchema, regenSchema, selectSchema } from './dto/ai.dto';
import { aiRateLimit } from '../../middlewares/aiRateLimit';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../config/env';

const router = Router({ mergeParams: true });

const idParam = z.object({ id: z.string().uuid() });

router.post('/drafts/:id/ai/generate', requireAuth, aiRateLimit, validateParams(idParam), validateBody(generateSchema), asyncHandler(generateController));
router.get('/drafts/:id/ai/results', requireAuth, validateParams(idParam), asyncHandler(resultsController));
router.post('/drafts/:id/ai/select', requireAuth, validateParams(idParam), validateBody(selectSchema), asyncHandler(selectController));
router.post('/drafts/:id/ai/regen', requireAuth, aiRateLimit, validateParams(idParam), validateBody(regenSchema), asyncHandler(regenController));

// Prompt templates
router.get('/ai/templates', asyncHandler(listTemplatesController));
router.post('/ai/templates/render', asyncHandler(renderTemplateController));

// Private original download (authorized owner or assigned designer)
router.get('/drafts/:id/ai/original/:imageKey', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const draftId = req.params.id as string;
  const draft = await (await import('../../config/database')).prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft || (draft.userId !== userId && draft.assignedDesignerId !== userId)) return res.status(403).json({ message: 'Forbidden' });
  const imageKey = req.params.imageKey as string;
  const baseDir = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR, 'tmp', 'ai');
  const candidatePath = path.join(baseDir, imageKey);
  const relative = path.relative(baseDir, candidatePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return res.status(400).json({ message: 'Invalid imageKey' });
  }
  if (path.extname(candidatePath).toLowerCase() !== '.png') {
    return res.status(400).json({ message: 'Invalid file type' });
  }
  try {
    const stat = await fs.stat(candidatePath);
    if (!stat.isFile()) return res.status(404).json({ message: 'Not found' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', String(stat.size));
    res.sendFile(candidatePath);
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
}));

export default router;


