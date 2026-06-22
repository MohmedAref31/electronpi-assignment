import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

function env(key: string, fallback: string = ''): string {
  const value = process.env[key];
  return value !== undefined && value !== '' ? value : fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const envVars = {
  nodeEnv: env('NODE_ENV', 'development'),
  isProduction: env('NODE_ENV', 'development') === 'production',
  isTest: env('NODE_ENV', 'development') === 'test',
  port: envInt('PORT', 3000),
  corsOrigin: env('CORS_ORIGIN', '*'),

  i18n: {
    defaultLanguage: env('DEFAULT_LANGUAGE', 'en'),
    supportedLanguages: env('SUPPORTED_LANGUAGES', 'en,ar').split(',').map((l) => l.trim()),
  },

  jwtSecret: env('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: env('JWT_EXPIRES_IN', '1h'),
  bcryptSaltRounds: envInt('BCRYPT_SALT_ROUNDS', 10),

  postgres: {
    host: env('POSTGRES_HOST', 'localhost'),
    port: envInt('POSTGRES_PORT', 5432),
    database: env('POSTGRES_DB', 'project_task_db'),
    username: env('POSTGRES_USER', 'postgres'),
    password: env('POSTGRES_PASSWORD', 'postgres'),
  },

  logLevel: env('LOG_LEVEL', 'debug'),
};

export type EnvVars = typeof envVars;
