import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../../config/env';
import { aiQueue, defaultJobOptions } from '../../../queue/ai.queue';
import { TEMPLATES } from '../templates/templates';
import { StabilityProvider } from '../../../services/ai/stability.provider';
import { applyWatermark } from '../../../shared/image/watermark';
import { checkPromptSafety } from '../service/safety';
import { tryAcquireDraftLock, releaseDraftLock } from '../service/locks';

async function ensureTmpDir() {
  const pub = path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR, 'tmp', 'ai');
  const pri = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR, 'tmp', 'ai');
  await fs.mkdir(pub, { recursive: true });
  await fs.mkdir(pri, { recursive: true });
  return { pub, pri };
}

// In-memory idempotency cache (no Redis)
const idemCache = new Map<string, { jobId: string; cost: number; ts: number }>();
const IDEM_TTL_MS = 5 * 60 * 1000;
function getIdemKey(userId: string, draftId: string, prompt: string, params: unknown) {
  return `${userId}:${draftId}:${prompt}:${JSON.stringify(params)}`.slice(0, 1000);
}
function getFromIdem(key: string) {
  const v = idemCache.get(key);
  if (!v) return undefined;
  if (Date.now() - v.ts > IDEM_TTL_MS) { idemCache.delete(key); return undefined; }
  return v;
}

export async function generateController(req: Request, res: Response) {
  const userId = req.user!.id;
  const draftId = req.params.id as string;
  const { templateId, fields, userPrompt, count = 3 } = req.body as { templateId?: string; fields?: Record<string, unknown>; userPrompt?: string; count?: number };

  // Spend credits (stub reserve)
  const draft = await prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft || draft.userId !== userId) return res.status(400).json({ message: 'Draft access denied' });

  const cost = Math.min(100 + (draft.aiRegenCount ?? 0) * 100, 300);
  const wallet = await prisma.creditWallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
  if (wallet.balance < cost) return res.status(402).json({ message: 'INSUFFICIENT_CREDITS', need: cost - wallet.balance });

  // Reserve: deduct immediately then enqueue job
  const tpl = templateId ? TEMPLATES.find(t => t.id === templateId) : undefined;
  const prompt = tpl ? tpl.render(fields || {}) : (userPrompt || '');
  const negative = tpl?.defaults.negative;
  const params = tpl?.defaults.params || { width: 1024, height: 1536, steps: 30, guidance: 6.5, model: 'sdxl' };

  // Safety filter
  const safety = checkPromptSafety(prompt);
  if (!safety.ok) return res.status(400).json({ message: 'UNSAFE_PROMPT', reason: safety.reason });

  // Idempotency + lock
  const clientKey = (req.headers['idempotency-key'] as string | undefined) || undefined;
  const idemKey = clientKey || getIdemKey(userId, draftId, prompt, { negative, params, count });
  const cached = getFromIdem(idemKey);
  if (cached) return res.status(202).json({ jobId: cached.jobId, cost: cached.cost, cached: true });
  if (!(await tryAcquireDraftLock(draftId))) return res.status(409).json({ message: 'DRAFT_BUSY' });
  try {

  const [, , createdJob] = await prisma.$transaction([
    prisma.creditWallet.update({ where: { userId }, data: { balance: { decrement: cost } } }),
    prisma.creditTransaction.create({ data: { userId, delta: -cost, type: 'spend', note: `ai-generate:${draftId}` } }),
    prisma.aiJob.create({ data: { draftId, userId, provider: 'stability', params: JSON.parse(JSON.stringify({ templateId, fields, userPrompt, count, prompt, negative, params, idemKey })), costCredits: cost, status: 'queued' } })
  ]);

  if (aiQueue) {
    await aiQueue.add(
      'generate',
      { jobId: createdJob.id, draftId, userId, prompt, negative, params, count: count ?? 1, costCredits: cost },
      defaultJobOptions
    );
  } else {
    // Fallback: run generation inline (no retries, no background)
    const job = await prisma.aiJob.findUnique({ where: { id: createdJob.id } });
    if (!job) return res.status(500).json({ message: 'Job create failed' });
    try {
      const provider = new StabilityProvider(env.STABILITY_API_KEY || '');
      const imgs = await provider.generate({ prompt, negative, params, count: count ?? 1 });
      const pubRoot = path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR);
      const priRoot = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR);
      await fs.mkdir(path.join(pubRoot, 'tmp', 'ai'), { recursive: true });
      await fs.mkdir(path.join(priRoot, 'tmp', 'ai'), { recursive: true });
      await Promise.all(
        imgs.map(async (buf, i) => {
          const baseName = `${draftId}-${job.id}-${Date.now()}-${i}`;
          const origRel = path.posix.join('tmp/ai', `${baseName}.png`);
          const wmRel = path.posix.join('tmp/ai', `${baseName}-wm.png`);
          await fs.writeFile(path.join(priRoot, origRel), buf);
          const wm = await applyWatermark(buf);
          await fs.writeFile(path.join(pubRoot, wmRel), wm);
          await prisma.generatedImage.create({ data: { draftId, jobId: job.id, storageKey: origRel, watermarkedUrl: path.posix.join('/uploads', wmRel) } });
        })
      );
      await prisma.aiJob.update({ where: { id: job.id }, data: { status: 'completed', finishedAt: new Date() } });
    } catch (err) {
      await prisma.aiJob.update({ where: { id: job.id }, data: { status: 'failed', error: String((err as any)?.message ?? err) } });
      await prisma.$transaction([
        prisma.creditWallet.update({ where: { userId }, data: { balance: { increment: cost } } }),
        prisma.creditTransaction.create({ data: { userId, delta: cost, type: 'refund', note: `ai-failed:${draftId}` } }),
      ]);
      return res.status(502).json({ message: 'AI provider error' });
    }
  }

  idemCache.set(idemKey, { jobId: createdJob.id, cost, ts: Date.now() });
  res.status(202).json({ jobId: createdJob.id, cost });
  } finally {
    await releaseDraftLock(draftId);
  }
}

export async function resultsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const draftId = req.params.id as string;
  const draft = await prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft || (draft.userId !== userId && draft.assignedDesignerId !== userId)) return res.status(400).json({ message: 'Draft access denied' });
  const jobs = await prisma.aiJob.findMany({ where: { draftId, userId }, orderBy: { createdAt: 'desc' }, include: { images: true } });
  res.status(200).json({ jobs });
}

export async function selectController(req: Request, res: Response) {
  const userId = req.user!.id;
  const draftId = req.params.id as string;
  const { imageId } = req.body as { imageId: string };
  const image = await prisma.generatedImage.findUnique({ where: { id: imageId } });
  if (!image) return res.status(404).json({ message: 'Image not found' });
  const draft = await prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft || draft.userId !== userId) return res.status(400).json({ message: 'Draft access denied' });

  // Copy to permanent path
  const srcAbs = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR, image.storageKey);
  const permKey = path.posix.join('drafts', draftId, `ai-selected-${path.basename(image.storageKey)}`);
  const dstAbs = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR, permKey);
  await fs.mkdir(path.dirname(dstAbs), { recursive: true });
  try {
    await fs.copyFile(srcAbs, dstAbs);
  } catch {}
  const draftData = typeof draft.data === 'object' && draft.data !== null ? (draft.data as any) : {};
  await prisma.draft.update({ where: { id: draftId }, data: { aiSelectedImageId: image.id, data: { ...draftData, aiSelectedKey: permKey } as any } });
  // Only expose public watermarked URL; original is private
  res.status(200).json({ selectedImageId: image.id, key: permKey, watermarkedUrl: image.watermarkedUrl });
}

export async function regenController(req: Request, res: Response) {
  const userId = req.user!.id;
  const draftId = req.params.id as string;
  const { count = 3 } = req.body as { count: number };
  const draft = await prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft || draft.userId !== userId) return res.status(400).json({ message: 'Draft access denied' });
  const cost = Math.min(100 + (draft.aiRegenCount ?? 0) * 100, 300);
  const wallet = await prisma.creditWallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
  if (wallet.balance < cost) return res.status(402).json({ message: 'INSUFFICIENT_CREDITS', need: cost - wallet.balance });
  const [, , job] = await prisma.$transaction([
    prisma.creditWallet.update({ where: { userId }, data: { balance: { decrement: cost } } }),
    prisma.creditTransaction.create({ data: { userId, delta: -cost, type: 'spend', note: `ai-regen:${draftId}` } }),
    prisma.aiJob.create({ data: { draftId, userId, provider: 'stability', params: { count }, costCredits: cost, status: 'queued' } })
  ]);

  // Try to reuse last params/prompt
  const last = await prisma.aiJob.findFirst({ where: { draftId, userId }, orderBy: { createdAt: 'desc' } });
  const lastParams = typeof last?.params === 'object' && last?.params !== null ? (last.params as any) : {};
  const tplParams = lastParams.params || { width: 1024, height: 1536, steps: 30, guidance: 6.5, model: 'sdxl' };
  const prompt = lastParams.prompt || draft.aiPromptFinal || '';
  const negative = lastParams.negative;

  if (aiQueue) {
    await aiQueue.add('generate', { jobId: job.id, draftId, userId, prompt, negative, params: tplParams, count, costCredits: cost }, defaultJobOptions);
    return res.status(202).json({ ok: true, cost });
  }

  // Inline fallback
  try {
    const provider = new StabilityProvider(env.STABILITY_API_KEY || '');
    const imgs = await provider.generate({ prompt, negative, params: tplParams, count });
    const pubRoot = path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR);
    const priRoot = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR);
    await fs.mkdir(path.join(pubRoot, 'tmp', 'ai'), { recursive: true });
    await fs.mkdir(path.join(priRoot, 'tmp', 'ai'), { recursive: true });
    await Promise.all(
      imgs.map(async (buf, i) => {
        const baseName = `${draftId}-${job.id}-${Date.now()}-${i}`;
        const origRel = path.posix.join('tmp/ai', `${baseName}.png`);
        const wmRel = path.posix.join('tmp/ai', `${baseName}-wm.png`);
        await fs.writeFile(path.join(priRoot, origRel), buf);
        const wm = await applyWatermark(buf);
        await fs.writeFile(path.join(pubRoot, wmRel), wm);
        await prisma.generatedImage.create({ data: { draftId, jobId: job.id, storageKey: origRel, watermarkedUrl: path.posix.join('/uploads', wmRel) } });
      })
    );
    await prisma.$transaction([
      prisma.aiJob.update({ where: { id: job.id }, data: { status: 'completed', finishedAt: new Date(), params: JSON.parse(JSON.stringify({ ...lastParams, prompt, negative, params: tplParams, count })) } }),
      prisma.draft.update({ where: { id: draftId }, data: { aiRegenCount: (draft.aiRegenCount ?? 0) + 1 } as any }),
    ]);
    res.status(202).json({ ok: true, cost });
  } catch (err) {
    await prisma.aiJob.update({ where: { id: job.id }, data: { status: 'failed', error: String((err as any)?.message ?? err) } });
    await prisma.$transaction([
      prisma.creditWallet.update({ where: { userId }, data: { balance: { increment: cost } } }),
      prisma.creditTransaction.create({ data: { userId, delta: cost, type: 'refund', note: `ai-failed:${draftId}` } }),
    ]);
    res.status(502).json({ message: 'AI provider error' });
  }
}


