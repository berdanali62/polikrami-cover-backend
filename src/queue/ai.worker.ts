import { createRedisConnection } from './connection';
import { AI_QUEUE_NAME } from './ai.queue';
import { Worker } from 'bullmq';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { StabilityProvider } from '../services/ai/stability.provider';
import { applyWatermark } from '../shared/image/watermark';
import { aiJobsFailedCounter } from '../middlewares/metrics';
import path from 'path';
import fs from 'fs/promises';
import { walletService } from '../modules/wallet/service/wallet.service';

const connection = createRedisConnection();

type AiGenParams = { width: number; height: number; steps?: number; guidance?: number; model?: string };
type AiJobPayload = { jobId: string; draftId: string; userId: string; prompt: string; negative?: string; params: AiGenParams; count: number; costCredits: number };

export const aiWorker = connection
  ? new Worker(
      AI_QUEUE_NAME,
      async (job: { data: AiJobPayload; attemptsMade?: number; opts?: { attempts?: number } }) => {
        const data = job.data;
        logger.info({ jobId: data.jobId, draftId: data.draftId }, 'AI job started');

        // Double-check job still queued
        const jobRecord = await prisma.aiJob.findUnique({ where: { id: data.jobId } });
        if (!jobRecord || jobRecord.status !== 'queued') {
          return;
        }

        try {
          const provider = new StabilityProvider(env.STABILITY_API_KEY || '');
          const images = await provider.generate({
            prompt: data.prompt,
            negative: data.negative,
            params: data.params,
            count: data.count,
          });

          const publicRoot = path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR);
          const privateRoot = path.join(process.cwd(), env.UPLOAD_PRIVATE_DIR);
          await fs.mkdir(path.join(publicRoot, 'tmp', 'ai'), { recursive: true });
          await fs.mkdir(path.join(privateRoot, 'tmp', 'ai'), { recursive: true });

          const saved = await Promise.all(
            images.map(async (buf, idx) => {
              const watermarked = await applyWatermark(buf);
              const baseName = `${data.draftId}-${data.jobId}-${Date.now()}-${idx}`;
              const origRel = path.posix.join('tmp/ai', `${baseName}.png`);
              const wmRel = path.posix.join('tmp/ai', `${baseName}-wm.png`);
              await fs.writeFile(path.join(privateRoot, origRel), buf);
              await fs.writeFile(path.join(publicRoot, wmRel), watermarked);
              const record = await prisma.generatedImage.create({
                data: {
                  draftId: data.draftId,
                  jobId: data.jobId,
                  storageKey: origRel, // PRIVATE original (no watermark)
                  watermarkedUrl: path.posix.join('/uploads', wmRel), // PUBLIC
                },
              });
              return record.id;
            })
          );

          await prisma.aiJob.update({ where: { id: data.jobId }, data: { status: 'completed', finishedAt: new Date() } });
          logger.info({ jobId: data.jobId, images: saved.length }, 'AI job completed');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.error({ error: msg, jobId: data.jobId }, 'AI job failed');
          await prisma.aiJob.update({ where: { id: data.jobId }, data: { status: 'failed', error: msg } });
          try { aiJobsFailedCounter.inc(); } catch { /* ignore */ }
          // Refund on final failure (BullMQ handles retries)
          if ((job.attemptsMade || 0) + 1 >= ((job.opts && job.opts.attempts) || 1)) {
            try {
              await walletService.increase(data.userId, data.costCredits, 'refund', `ai-failed:${data.draftId}`, data.jobId);
            } catch (walletErr) {
              logger.error({ walletErr, jobId: data.jobId }, 'Wallet refund failed');
            }
          }
          throw err; // let BullMQ retry
        }
      },
      { connection }
    )
  : undefined;


