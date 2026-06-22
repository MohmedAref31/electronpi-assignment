import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * Centralized error-handling middleware.
 * Must be registered LAST (after all routes and the 404 handler).
 * Translates messages using the request's resolved language (req.t).
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const t = req.t ?? ((key: string) => key);
  let statusCode = 500;
  let message = t('errors.internal');
  let details: unknown | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    // Prefer the i18n code if present, fall back to the raw message
    message = err.code ? t(err.code, err.params) : err.message;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
    // Preserve specific TypeORM error codes when possible
    const code = (err as Error & { code?: string }).code;
    if (code === '23505') {
      statusCode = 409;
      message = t('errors.uniqueViolation');
    } else if (code === '23503') {
      statusCode = 400;
      message = t('errors.foreignKeyViolation');
    } else if (code === '23502') {
      statusCode = 400;
      message = t('errors.notNullViolation');
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
