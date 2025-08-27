#!/usr/bin/env tsx

import { EmailQueueCleanup } from '../shared/email/cleanup';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('Starting email queue cleanup...');
    
    // Get current stats
    const statsBefore = await EmailQueueCleanup.getStats();
    logger.info(statsBefore, 'Email queue stats before cleanup');
    
    // Clean up old processed emails (older than 30 days)
    const deletedOld = await EmailQueueCleanup.cleanupOldRecords(30);
    
    // Clean up failed emails (older than 24 hours)
    const deletedFailed = await EmailQueueCleanup.cleanupFailedRecords(24);
    
    // Get stats after cleanup
    const statsAfter = await EmailQueueCleanup.getStats();
    logger.info(statsAfter, 'Email queue stats after cleanup');
    
    logger.info({
      deletedOld,
      deletedFailed,
      totalDeleted: deletedOld + deletedFailed
    }, 'Email queue cleanup completed successfully');
    
  } catch (error) {
    logger.error({ error }, 'Email queue cleanup failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(() => process.exit(0));
}

export { main as cleanupEmailQueue };
