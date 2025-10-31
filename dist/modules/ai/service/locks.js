"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryAcquireDraftLock = tryAcquireDraftLock;
exports.releaseDraftLock = releaseDraftLock;
const connection_1 = require("../../../queue/connection");
const activeLocks = new Set();
const redis = (0, connection_1.createRedisConnection)();
const LOCK_TTL_MS = 60_000; // 60s
async function tryAcquireDraftLock(draftId) {
    const key = `lock:draft:${draftId}`;
    if (redis) {
        try {
            // SET key value NX PX ttl
            const ok = await redis.set(key, '1', 'PX', LOCK_TTL_MS, 'NX');
            return ok === 'OK';
        }
        catch {
            // Fallback to in-memory if Redis fails
        }
    }
    if (activeLocks.has(draftId))
        return false;
    activeLocks.add(draftId);
    return true;
}
async function releaseDraftLock(draftId) {
    const key = `lock:draft:${draftId}`;
    if (redis) {
        try {
            await redis.del(key);
        }
        catch {
            // ignore
        }
    }
    activeLocks.delete(draftId);
}
