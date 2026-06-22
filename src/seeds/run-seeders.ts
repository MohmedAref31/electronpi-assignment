import { AppDataSource } from '../data-source';
import { envVars } from '../config/env';
import { logger } from '../utils/logger';
import { seedAdmin } from './admin.seeder';
import { seedData } from './data.seeder';

async function runSeeders(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established for seeding', {
      db: envVars.postgres.database,
    });

    const only = process.argv.includes('--only');
    const target = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];

    if (!only && !target) {
      // Run all seeders in order
      await seedAdmin();
      await seedData();
    } else if (target) {
      // Run a specific seeder: npm run seed -- --only=admin
      switch (target) {
        case 'admin':
          await seedAdmin();
          break;
        case 'data':
          await seedData();
          break;
        default:
          throw new Error(`Unknown seeder "${target}". Available: admin, data`);
      }
    } else if (only) {
      // --only without a value - run admin only as a safe default
      await seedAdmin();
    }

    logger.info('Seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed', { error: (error as Error).message });
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  }
}

void runSeeders();
