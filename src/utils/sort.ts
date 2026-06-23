import type { Pagination, SortOrder } from '../middlewares/pagination';

/**
 * Builds a TypeORM `order` object from the pagination sort params,
 * validating the field against a whitelist.
 *
 * Falls back to `{ [defaultField]: defaultOrder }` when sortBy is missing
 * or not in the allowed list.
 */
export function buildOrderClause(
  pagination: Pagination,
  allowedFields: string[],
  defaultField: string = 'createdAt',
  defaultOrder: SortOrder = 'DESC',
): Record<string, SortOrder> {
  const { sortBy, sortOrder } = pagination;

  if (sortBy && allowedFields.includes(sortBy)) {
    return { [sortBy]: sortOrder };
  }

  return { [defaultField]: defaultOrder };
}
