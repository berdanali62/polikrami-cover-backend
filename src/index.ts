import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { shutdownDatabase } from './config/database';

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
});

async function gracefulShutdown(signal: string) {
  try {
    logger.info({ signal }, 'Graceful shutdown start');
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await shutdownDatabase();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

