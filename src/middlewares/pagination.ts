import { Request, Response, NextFunction } from 'express';

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;
export const DEFAULT_PAGE = 1;

export type SortOrder = 'ASC' | 'DESC';

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder: SortOrder;
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Resolved pagination, set by the paginationMiddleware */
    pagination?: Pagination;
  }
}

/**
 * Extracts `page`, `limit`, `sortBy`, and `sortOrder` from the query string,
 * validates and clamps them, and attaches a `Pagination` object (with
 * pre-computed `skip`) to `req.pagination`.
 *
 * Defaults: page=1, limit=20, max limit=100, sort by createdAt DESC.
 *
 * `sortBy` is extracted as a raw string - each service is responsible for
 * validating it against its own whitelist of allowed columns.
 */
export function paginationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const page = Math.max(1, parseInt(String(req.query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const rawLimit = parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

  const rawSortOrder = String(req.query.sortOrder ?? '').toUpperCase();
  const sortOrder: SortOrder = rawSortOrder === 'ASC' ? 'ASC' : 'DESC';

  const sortBy = typeof req.query.sortBy === 'string' && req.query.sortBy.trim()
    ? req.query.sortBy.trim()
    : undefined;

  req.pagination = { page, limit, skip: (page - 1) * limit, sortBy, sortOrder };
  next();
}
