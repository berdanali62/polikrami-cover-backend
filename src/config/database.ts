import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }, 'error', 'warn'],
});

prisma.$on('query', (e) => {
  logger.debug({ sql: e.query, params: e.params, duration: e.duration }, 'DB query');
});

export async function shutdownDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
  } catch (err) {
    logger.error({ err }, 'Error during Prisma disconnect');
  }
}

