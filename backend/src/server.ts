import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/prisma';

const PORT = Number(process.env.PORT || env.PORT || 3001);
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on http://${HOST}:${PORT} in ${env.NODE_ENV} mode`);
});

// ─── Graceful Shutdown ──────────────────────────────
// Ensures in-flight requests complete and DB connections are cleanly closed
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
    } catch (err) {
      logger.error('Error closing database connection.');
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown — could not close connections in time.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
  // Don't crash, but log for monitoring
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  gracefulShutdown('uncaughtException');
});
