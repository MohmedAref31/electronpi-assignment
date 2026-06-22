import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * Centralized error-handling middleware.
 * Must be registered LAST (after all routes and the 404 handler).
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
    // Preserve specific TypeORM error codes when possible
    const code = (err as Error & { code?: string }).code;
    if (code === '23505') {
      statusCode = 409;
      message = 'A resource with that unique value already exists';
    } else if (code === '23503') {
      statusCode = 400;
      message = 'Referenced resource does not exist';
    } else if (code === '23502') {
      statusCode = 400;
      message = 'Missing required field';
    }
  }

  if (statusCode >= 500) {
    logger.error('Unhandled error', { message, stack: err instanceof Error ? err.stack : undefined });
  } else if (statusCode >= 400) {
    logger.warn('Client error', { statusCode, message });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}
