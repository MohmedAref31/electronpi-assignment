import { createApp } from './app';
import { AppDataSource } from './data-source';
import { envVars } from './config/env';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // Create and start the Express app
    const app = createApp();

    const server = app.listen(envVars.port, () => {
      logger.info(`Server listening on port ${envVars.port} (${envVars.nodeEnv})`);
      logger.info(`API base URL: http://localhost:${envVars.port}/api/v1`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received - shutting down gracefully`);
      server.close(async () => {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
        }
        process.exit(0);
      });
      // Force exit after 10s if graceful shutdown stalls
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

void bootstrap();
