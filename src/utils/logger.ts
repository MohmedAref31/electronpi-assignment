import winston from 'winston';
import { envVars } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${stack ?? message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: envVars.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    logFormat,
  ),
  defaultMeta: { service: 'project-task-api' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
});

if (envVars.isProduction) {
  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  );
}

export default logger;
