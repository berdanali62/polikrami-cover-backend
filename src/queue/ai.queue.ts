import { createRedisConnection } from './connection';
let BullMQ: any;
try { BullMQ = require('bullmq'); } catch { BullMQ = null; }

export type AiJobData = {
  jobId: string;
  draftId: string;
  userId: string;
  prompt: string;
  negative?: string;
  params: { width: number; height: number; steps?: number; guidance?: number; model?: string };
  count: number;
  costCredits: number;
};

export const AI_QUEUE_NAME = 'ai:generate';

const connection = createRedisConnection();

export const aiQueue = connection && BullMQ
  ? new BullMQ.Queue(AI_QUEUE_NAME, { connection })
  : undefined;

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 3000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};


