#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupEmailQueue = main;
const cleanup_1 = require("../shared/email/cleanup");
const logger_1 = require("../utils/logger");
async function main() {
    try {
        logger_1.logger.info('Starting email queue cleanup...');
        // Get current stats
        const statsBefore = await cleanup_1.EmailQueueCleanup.getStats();
        logger_1.logger.info(statsBefore, 'Email queue stats before cleanup');
        // Clean up old processed emails (older than 30 days)
        const deletedOld = await cleanup_1.EmailQueueCleanup.cleanupOldRecords(30);
        // Clean up failed emails (older than 24 hours)
        const deletedFailed = await cleanup_1.EmailQueueCleanup.cleanupFailedRecords(24);
        // Get stats after cleanup
        const statsAfter = await cleanup_1.EmailQueueCleanup.getStats();
        logger_1.logger.info(statsAfter, 'Email queue stats after cleanup');
        logger_1.logger.info({
            deletedOld,
            deletedFailed,
            totalDeleted: deletedOld + deletedFailed
        }, 'Email queue cleanup completed successfully');
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Email queue cleanup failed');
        process.exit(1);
    }
}
if (require.main === module) {
    main().then(() => process.exit(0));
}
