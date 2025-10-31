export declare class EmailQueueCleanup {
    /**
     * Clean up old email queue records
     * @param olderThanDays - Delete records older than this many days (default: 30)
     * @param batchSize - Process records in batches (default: 1000)
     */
    static cleanupOldRecords(olderThanDays?: number, batchSize?: number): Promise<number>;
    /**
     * Clean up failed email attempts older than specified hours
     * @param olderThanHours - Delete failed records older than this many hours (default: 24)
     */
    static cleanupFailedRecords(olderThanHours?: number): Promise<number>;
    /**
     * Get email queue statistics
     */
    static getStats(): Promise<{
        total: number;
        queued: number;
        sent: number;
        failed: number;
        oldestRecord: Date | null;
    }>;
}
