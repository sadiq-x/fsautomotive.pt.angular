/**
 * Pagination shared by every list endpoint.
 *
 * Defined once because the alternative — each module inventing its own bounds —
 * is how an API ends up with `limit`, `perPage` and `page_size` on three
 * neighbouring routes, and how one forgotten upper bound turns into a request
 * for fifty thousand records.
 */
import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 25;
export const MAX_PER_PAGE = 100;

/** Query-string pagination, coerced from strings and hard-bounded. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  perPage: z.coerce.number().int().min(1).max(MAX_PER_PAGE).default(DEFAULT_PER_PAGE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Derives `totalPages` when the upstream reported a total. */
export function toPaginationMeta(
  query: PaginationQuery,
  total: number | undefined,
): { page: number; perPage: number; total?: number; totalPages?: number } {
  if (total === undefined) {
    return { page: query.page, perPage: query.perPage };
  }

  return {
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.perPage)),
  };
}
