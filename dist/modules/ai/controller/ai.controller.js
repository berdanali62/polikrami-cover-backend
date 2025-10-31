"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateController = generateController;
exports.resultsController = resultsController;
exports.selectController = selectController;
exports.regenController = regenController;
const database_1 = require("../../../config/database");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const env_1 = require("../../../config/env");
const ai_queue_1 = require("../../../queue/ai.queue");
const templates_1 = require("../templates/templates");
const stability_provider_1 = require("../../../services/ai/stability.provider");
const watermark_1 = require("../../../shared/image/watermark");
const safety_1 = require("../service/safety");
const locks_1 = require("../service/locks");
async function ensureTmpDir() {
    const pub = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR, 'tmp', 'ai');
    const pri = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR, 'tmp', 'ai');
    await promises_1.default.mkdir(pub, { recursive: true });
    await promises_1.default.mkdir(pri, { recursive: true });
    return { pub, pri };
}
// In-memory idempotency cache (no Redis)
const idemCache = new Map();
const IDEM_TTL_MS = 5 * 60 * 1000;
function getIdemKey(userId, draftId, prompt, params) {
    return `${userId}:${draftId}:${prompt}:${JSON.stringify(params)}`.slice(0, 1000);
}
function getFromIdem(key) {
    const v = idemCache.get(key);
    if (!v)
        return undefined;
    if (Date.now() - v.ts > IDEM_TTL_MS) {
        idemCache.delete(key);
        return undefined;
    }
    return v;
}
async function generateController(req, res) {
    const userId = req.user.id;
    const draftId = req.params.id;
    const { templateId, fields, userPrompt, count = 3 } = req.body;
    // Spend credits (stub reserve)
    const draft = await database_1.prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || draft.userId !== userId)
        return res.status(400).json({ message: 'Draft access denied' });
    const cost = Math.min(100 + (draft.aiRegenCount ?? 0) * 100, 300);
    const wallet = await database_1.prisma.creditWallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
    if (wallet.balance < cost)
        return res.status(402).json({ message: 'INSUFFICIENT_CREDITS', need: cost - wallet.balance });
    // Reserve: deduct immediately then enqueue job
    const tpl = templateId ? templates_1.TEMPLATES.find(t => t.id === templateId) : undefined;
    const prompt = tpl ? tpl.render(fields || {}) : (userPrompt || '');
    const negative = tpl?.defaults.negative;
    const params = tpl?.defaults.params || { width: 1024, height: 1536, steps: 30, guidance: 6.5, model: 'sdxl' };
    // Safety filter
    const safety = (0, safety_1.checkPromptSafety)(prompt);
    if (!safety.ok)
        return res.status(400).json({ message: 'UNSAFE_PROMPT', reason: safety.reason });
    // Idempotency + lock
    const clientKey = req.headers['idempotency-key'] || undefined;
    const idemKey = clientKey || getIdemKey(userId, draftId, prompt, { negative, params, count });
    const cached = getFromIdem(idemKey);
    if (cached)
        return res.status(202).json({ jobId: cached.jobId, cost: cached.cost, cached: true });
    if (!(await (0, locks_1.tryAcquireDraftLock)(draftId)))
        return res.status(409).json({ message: 'DRAFT_BUSY' });
    try {
        const [, , createdJob] = await database_1.prisma.$transaction([
            database_1.prisma.creditWallet.update({ where: { userId }, data: { balance: { decrement: cost } } }),
            database_1.prisma.creditTransaction.create({ data: { userId, delta: -cost, type: 'spend', note: `ai-generate:${draftId}` } }),
            database_1.prisma.aiJob.create({ data: { draftId, userId, provider: 'stability', params: JSON.parse(JSON.stringify({ templateId, fields, userPrompt, count, prompt, negative, params, idemKey })), costCredits: cost, status: 'queued' } })
        ]);
        if (ai_queue_1.aiQueue) {
            await ai_queue_1.aiQueue.add('generate', { jobId: createdJob.id, draftId, userId, prompt, negative, params, count: count ?? 1, costCredits: cost }, ai_queue_1.defaultJobOptions);
        }
        else {
            // Fallback: run generation inline (no retries, no background)
            const job = await database_1.prisma.aiJob.findUnique({ where: { id: createdJob.id } });
            if (!job)
                return res.status(500).json({ message: 'Job create failed' });
            try {
                const provider = new stability_provider_1.StabilityProvider(env_1.env.STABILITY_API_KEY || '');
                const imgs = await provider.generate({ prompt, negative, params, count: count ?? 1 });
                const pubRoot = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR);
                const priRoot = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR);
                await promises_1.default.mkdir(path_1.default.join(pubRoot, 'tmp', 'ai'), { recursive: true });
                await promises_1.default.mkdir(path_1.default.join(priRoot, 'tmp', 'ai'), { recursive: true });
                await Promise.all(imgs.map(async (buf, i) => {
                    const baseName = `${draftId}-${job.id}-${Date.now()}-${i}`;
                    const origRel = path_1.default.posix.join('tmp/ai', `${baseName}.png`);
                    const wmRel = path_1.default.posix.join('tmp/ai', `${baseName}-wm.png`);
                    await promises_1.default.writeFile(path_1.default.join(priRoot, origRel), buf);
                    const wm = await (0, watermark_1.applyWatermark)(buf);
                    await promises_1.default.writeFile(path_1.default.join(pubRoot, wmRel), wm);
                    await database_1.prisma.generatedImage.create({ data: { draftId, jobId: job.id, storageKey: origRel, watermarkedUrl: path_1.default.posix.join('/uploads', wmRel) } });
                }));
                await database_1.prisma.aiJob.update({ where: { id: job.id }, data: { status: 'completed', finishedAt: new Date() } });
            }
            catch (err) {
                await database_1.prisma.aiJob.update({ where: { id: job.id }, data: { status: 'failed', error: String(err?.message ?? err) } });
                await database_1.prisma.$transaction([
                    database_1.prisma.creditWallet.update({ where: { userId }, data: { balance: { increment: cost } } }),
                    database_1.prisma.creditTransaction.create({ data: { userId, delta: cost, type: 'refund', note: `ai-failed:${draftId}` } }),
                ]);
                return res.status(502).json({ message: 'AI provider error' });
            }
        }
        idemCache.set(idemKey, { jobId: createdJob.id, cost, ts: Date.now() });
        res.status(202).json({ jobId: createdJob.id, cost });
    }
    finally {
        await (0, locks_1.releaseDraftLock)(draftId);
    }
}
async function resultsController(req, res) {
    const userId = req.user.id;
    const draftId = req.params.id;
    const draft = await database_1.prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || (draft.userId !== userId && draft.assignedDesignerId !== userId))
        return res.status(400).json({ message: 'Draft access denied' });
    const jobs = await database_1.prisma.aiJob.findMany({ where: { draftId, userId }, orderBy: { createdAt: 'desc' }, include: { images: true } });
    res.status(200).json({ jobs });
}
async function selectController(req, res) {
    const userId = req.user.id;
    const draftId = req.params.id;
    const { imageId } = req.body;
    const image = await database_1.prisma.generatedImage.findUnique({ where: { id: imageId } });
    if (!image)
        return res.status(404).json({ message: 'Image not found' });
    const draft = await database_1.prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || draft.userId !== userId)
        return res.status(400).json({ message: 'Draft access denied' });
    // Copy to permanent path
    const srcAbs = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR, image.storageKey);
    const permKey = path_1.default.posix.join('drafts', draftId, `ai-selected-${path_1.default.basename(image.storageKey)}`);
    const dstAbs = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR, permKey);
    await promises_1.default.mkdir(path_1.default.dirname(dstAbs), { recursive: true });
    try {
        await promises_1.default.copyFile(srcAbs, dstAbs);
    }
    catch { }
    const draftData = typeof draft.data === 'object' && draft.data !== null ? draft.data : {};
    await database_1.prisma.draft.update({ where: { id: draftId }, data: { aiSelectedImageId: image.id, data: { ...draftData, aiSelectedKey: permKey } } });
    // Only expose public watermarked URL; original is private
    res.status(200).json({ selectedImageId: image.id, key: permKey, watermarkedUrl: image.watermarkedUrl });
}
async function regenController(req, res) {
    const userId = req.user.id;
    const draftId = req.params.id;
    const { count = 3 } = req.body;
    const draft = await database_1.prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || draft.userId !== userId)
        return res.status(400).json({ message: 'Draft access denied' });
    const cost = Math.min(100 + (draft.aiRegenCount ?? 0) * 100, 300);
    const wallet = await database_1.prisma.creditWallet.upsert({ where: { userId }, update: {}, create: { userId, balance: 0 } });
    if (wallet.balance < cost)
        return res.status(402).json({ message: 'INSUFFICIENT_CREDITS', need: cost - wallet.balance });
    const [, , job] = await database_1.prisma.$transaction([
        database_1.prisma.creditWallet.update({ where: { userId }, data: { balance: { decrement: cost } } }),
        database_1.prisma.creditTransaction.create({ data: { userId, delta: -cost, type: 'spend', note: `ai-regen:${draftId}` } }),
        database_1.prisma.aiJob.create({ data: { draftId, userId, provider: 'stability', params: { count }, costCredits: cost, status: 'queued' } })
    ]);
    // Try to reuse last params/prompt
    const last = await database_1.prisma.aiJob.findFirst({ where: { draftId, userId }, orderBy: { createdAt: 'desc' } });
    const lastParams = typeof last?.params === 'object' && last?.params !== null ? last.params : {};
    const tplParams = lastParams.params || { width: 1024, height: 1536, steps: 30, guidance: 6.5, model: 'sdxl' };
    const prompt = lastParams.prompt || draft.aiPromptFinal || '';
    const negative = lastParams.negative;
    if (ai_queue_1.aiQueue) {
        await ai_queue_1.aiQueue.add('generate', { jobId: job.id, draftId, userId, prompt, negative, params: tplParams, count, costCredits: cost }, ai_queue_1.defaultJobOptions);
        return res.status(202).json({ ok: true, cost });
    }
    // Inline fallback
    try {
        const provider = new stability_provider_1.StabilityProvider(env_1.env.STABILITY_API_KEY || '');
        const imgs = await provider.generate({ prompt, negative, params: tplParams, count });
        const pubRoot = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR);
        const priRoot = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR);
        await promises_1.default.mkdir(path_1.default.join(pubRoot, 'tmp', 'ai'), { recursive: true });
        await promises_1.default.mkdir(path_1.default.join(priRoot, 'tmp', 'ai'), { recursive: true });
        await Promise.all(imgs.map(async (buf, i) => {
            const baseName = `${draftId}-${job.id}-${Date.now()}-${i}`;
            const origRel = path_1.default.posix.join('tmp/ai', `${baseName}.png`);
            const wmRel = path_1.default.posix.join('tmp/ai', `${baseName}-wm.png`);
            await promises_1.default.writeFile(path_1.default.join(priRoot, origRel), buf);
            const wm = await (0, watermark_1.applyWatermark)(buf);
            await promises_1.default.writeFile(path_1.default.join(pubRoot, wmRel), wm);
            await database_1.prisma.generatedImage.create({ data: { draftId, jobId: job.id, storageKey: origRel, watermarkedUrl: path_1.default.posix.join('/uploads', wmRel) } });
        }));
        await database_1.prisma.$transaction([
            database_1.prisma.aiJob.update({ where: { id: job.id }, data: { status: 'completed', finishedAt: new Date(), params: JSON.parse(JSON.stringify({ ...lastParams, prompt, negative, params: tplParams, count })) } }),
            database_1.prisma.draft.update({ where: { id: draftId }, data: { aiRegenCount: (draft.aiRegenCount ?? 0) + 1 } }),
        ]);
        res.status(202).json({ ok: true, cost });
    }
    catch (err) {
        await database_1.prisma.aiJob.update({ where: { id: job.id }, data: { status: 'failed', error: String(err?.message ?? err) } });
        await database_1.prisma.$transaction([
            database_1.prisma.creditWallet.update({ where: { userId }, data: { balance: { increment: cost } } }),
            database_1.prisma.creditTransaction.create({ data: { userId, delta: cost, type: 'refund', note: `ai-failed:${draftId}` } }),
        ]);
        res.status(502).json({ message: 'AI provider error' });
    }
}
