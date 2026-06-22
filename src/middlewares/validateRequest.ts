import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/**
 * express-validator result handler.
 * Place this after a chain of check() / body() / param() / query() validators.
 */
export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }
  const formatted = errors.array().map((e) => ({
    field: e.type === 'field' ? (e as { path: string }).path : e.type,
    message: e.msg,
  }));
  next(ApiError.badRequest('Validation failed', formatted));
}
