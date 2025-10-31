"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultJobOptions = exports.aiQueue = exports.AI_QUEUE_NAME = void 0;
const connection_1 = require("./connection");
let BullMQ;
try {
    BullMQ = require('bullmq');
}
catch {
    BullMQ = null;
}
exports.AI_QUEUE_NAME = 'ai:generate';
const connection = (0, connection_1.createRedisConnection)();
exports.aiQueue = connection && BullMQ
    ? new BullMQ.Queue(exports.AI_QUEUE_NAME, { connection })
    : undefined;
exports.defaultJobOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 500,
};
