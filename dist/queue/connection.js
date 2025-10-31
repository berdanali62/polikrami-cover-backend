"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisConnection = createRedisConnection;
const env_1 = require("../config/env");
let IORedis;
try {
    IORedis = require('ioredis');
}
catch {
    IORedis = null;
}
function createRedisConnection() {
    if (!env_1.env.REDIS_URL || !IORedis)
        return undefined;
    const redis = new IORedis(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    });
    return redis;
}
