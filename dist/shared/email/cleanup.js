"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueCleanup = void 0;
const database_1 = require("../../config/database");
const logger_1 = require("../../utils/logger");
class EmailQueueCleanup {
    /**
     * Clean up old email queue records
     * @param olderThanDays - Delete records older than this many days (default: 30)
     * @param batchSize - Process records in batches (default: 1000)
     */
    static async cleanupOldRecords(olderThanDays = 30, batchSize = 1000) {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        let totalDeleted = 0;
        try {
            while (true) {
                const result = await database_1.prisma.emailQueue.deleteMany({
                    where: {
                        createdAt: { lt: cutoffDate },
                        status: { in: ['sent', 'failed'] } // Only delete processed emails
                    }
                });
                totalDeleted += result.count;
                if (result.count < batchSize) {
                    break; // No more records to delete
                }
                // Small delay between batches to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            logger_1.logger.info({ deletedCount: totalDeleted, olderThanDays }, 'Email queue cleanup completed');
            return totalDeleted;
        }
        catch (error) {
            logger_1.logger.error({ error, olderThanDays }, 'Email queue cleanup failed');
            throw error;
        }
    }
    /**
     * Clean up failed email attempts older than specified hours
     * @param olderThanHours - Delete failed records older than this many hours (default: 24)
     */
    static async cleanupFailedRecords(olderThanHours = 24) {
        const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        try {
            const result = await database_1.prisma.emailQueue.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    status: 'failed'
                }
            });
            logger_1.logger.info({ deletedCount: result.count, olderThanHours }, 'Failed email queue cleanup completed');
            return result.count;
        }
        catch (error) {
            logger_1.logger.error({ error, olderThanHours }, 'Failed email queue cleanup failed');
            throw error;
        }
    }
    /**
     * Get email queue statistics
     */
    static async getStats() {
        const [stats, oldestRecord] = await Promise.all([
            database_1.prisma.emailQueue.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            database_1.prisma.emailQueue.findFirst({
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true }
            })
        ]);
        const statsByStatus = stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
        }, {});
        return {
            total: stats.reduce((sum, stat) => sum + stat._count.id, 0),
            queued: statsByStatus.queued || 0,
            sent: statsByStatus.sent || 0,
            failed: statsByStatus.failed || 0,
            oldestRecord: oldestRecord?.createdAt || null
        };
    }
}
exports.EmailQueueCleanup = EmailQueueCleanup;
