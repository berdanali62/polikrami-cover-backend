import { createRedisConnection } from '../../../queue/connection';

const activeLocks = new Set<string>();
const redis = createRedisConnection();
const LOCK_TTL_MS = 60_000; // 60s

export async function tryAcquireDraftLock(draftId: string): Promise<boolean> {
  const key = `lock:draft:${draftId}`;
  if (redis) {
    try {
      // SET key value NX PX ttl
      const ok = await redis.set(key, '1', 'PX', LOCK_TTL_MS, 'NX');
      return ok === 'OK';
    } catch {
      // Fallback to in-memory if Redis fails
    }
  }
  if (activeLocks.has(draftId)) return false;
  activeLocks.add(draftId);
  return true;
}

export async function releaseDraftLock(draftId: string): Promise<void> {
  const key = `lock:draft:${draftId}`;
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
  activeLocks.delete(draftId);
}


