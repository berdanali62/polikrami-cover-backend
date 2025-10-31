"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiWorker = void 0;
const connection_1 = require("./connection");
const ai_queue_1 = require("./ai.queue");
const bullmq_1 = require("bullmq");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const stability_provider_1 = require("../services/ai/stability.provider");
const watermark_1 = require("../shared/image/watermark");
const metrics_1 = require("../middlewares/metrics");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const wallet_service_1 = require("../modules/wallet/service/wallet.service");
const connection = (0, connection_1.createRedisConnection)();
exports.aiWorker = connection
    ? new bullmq_1.Worker(ai_queue_1.AI_QUEUE_NAME, async (job) => {
        const data = job.data;
        logger_1.logger.info({ jobId: data.jobId, draftId: data.draftId }, 'AI job started');
        // Double-check job still queued
        const jobRecord = await database_1.prisma.aiJob.findUnique({ where: { id: data.jobId } });
        if (!jobRecord || jobRecord.status !== 'queued') {
            return;
        }
        try {
            const provider = new stability_provider_1.StabilityProvider(env_1.env.STABILITY_API_KEY || '');
            const images = await provider.generate({
                prompt: data.prompt,
                negative: data.negative,
                params: data.params,
                count: data.count,
            });
            const publicRoot = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR);
            const privateRoot = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR);
            await promises_1.default.mkdir(path_1.default.join(publicRoot, 'tmp', 'ai'), { recursive: true });
            await promises_1.default.mkdir(path_1.default.join(privateRoot, 'tmp', 'ai'), { recursive: true });
            const saved = await Promise.all(images.map(async (buf, idx) => {
                const watermarked = await (0, watermark_1.applyWatermark)(buf);
                const baseName = `${data.draftId}-${data.jobId}-${Date.now()}-${idx}`;
                const origRel = path_1.default.posix.join('tmp/ai', `${baseName}.png`);
                const wmRel = path_1.default.posix.join('tmp/ai', `${baseName}-wm.png`);
                await promises_1.default.writeFile(path_1.default.join(privateRoot, origRel), buf);
                await promises_1.default.writeFile(path_1.default.join(publicRoot, wmRel), watermarked);
                const record = await database_1.prisma.generatedImage.create({
                    data: {
                        draftId: data.draftId,
                        jobId: data.jobId,
                        storageKey: origRel, // PRIVATE original (no watermark)
                        watermarkedUrl: path_1.default.posix.join('/uploads', wmRel), // PUBLIC
                    },
                });
                return record.id;
            }));
            await database_1.prisma.aiJob.update({ where: { id: data.jobId }, data: { status: 'completed', finishedAt: new Date() } });
            logger_1.logger.info({ jobId: data.jobId, images: saved.length }, 'AI job completed');
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger_1.logger.error({ error: msg, jobId: data.jobId }, 'AI job failed');
            await database_1.prisma.aiJob.update({ where: { id: data.jobId }, data: { status: 'failed', error: msg } });
            try {
                metrics_1.aiJobsFailedCounter.inc();
            }
            catch { /* ignore */ }
            // Refund on final failure (BullMQ handles retries)
            if ((job.attemptsMade || 0) + 1 >= ((job.opts && job.opts.attempts) || 1)) {
                try {
                    await wallet_service_1.walletService.increase(data.userId, data.costCredits, 'refund', `ai-failed:${data.draftId}`, data.jobId);
                }
                catch (walletErr) {
                    logger_1.logger.error({ walletErr, jobId: data.jobId }, 'Wallet refund failed');
                }
            }
            throw err; // let BullMQ retry
        }
    }, { connection })
    : undefined;
