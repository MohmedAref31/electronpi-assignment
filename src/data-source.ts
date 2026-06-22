import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { envVars } from './config/env';

// Entities will be wired in as they are implemented
const entities: string[] = [__dirname + '/../entities/*.{ts,js}'];

// Migrations are generated into src/migrations and compiled to dist/migrations
const migrations: string[] = [__dirname + '/../migrations/*.{ts,js}'];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: envVars.postgres.host,
  port: envVars.postgres.port,
  database: envVars.postgres.database,
  username: envVars.postgres.username,
  password: envVars.postgres.password,
  synchronize: false, // Always use migrations - never synchronize in production
  logging: envVars.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  entities,
  migrations,
  migrationsTableName: 'migrations',
  extra: {
    max: 10,
    connectionTimeoutMillis: 5000,
  },
};

// Singleton DataSource used by the app and the TypeORM CLI
export const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
