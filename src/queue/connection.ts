import { env } from '../config/env';
let IORedis: any;
try { IORedis = require('ioredis'); } catch { IORedis = null; }

export function createRedisConnection(): any | undefined {
  if (!env.REDIS_URL || !IORedis) return undefined;
  const redis = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return redis;
}


