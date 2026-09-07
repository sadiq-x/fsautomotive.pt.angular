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

/** Reads the upstream `has_more` flag, which is the only paging signal sent. */
export function readHasMore(meta: Record<string, unknown> | undefined): boolean | undefined {
  const value = meta?.['has_more'];
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Builds the pagination envelope from what the upstream actually reported.
 *
 * OfficeGest sends no `total` on any list endpoint — only `has_more` — so
 * `total` and `totalPages` are almost always absent and the caller must cope.
 * `hasMore` is forwarded because it is the one reliable "is there a next page"
 * signal: inferring it from a short page is wrong whenever the last page
 * happens to be exactly full.
 */
export function toPaginationMeta(
  query: PaginationQuery,
  total: number | undefined,
  hasMore?: boolean,
): { page: number; perPage: number; total?: number; totalPages?: number; hasMore?: boolean } {
  if (total === undefined) {
    return { page: query.page, perPage: query.perPage, hasMore };
  }

  return {
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    hasMore,
  };
}
