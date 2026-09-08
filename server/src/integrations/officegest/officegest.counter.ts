/**
 * Counting a collection the upstream refuses to count for us.
 *
 * WHY THIS EXISTS
 * ---------------
 * No OfficeGest list endpoint reports a total. The envelope carries
 * `current_page`, `per_page` and `has_more`, and nothing else — so "128
 * clientes" cannot be read from a response, only established by walking the
 * collection until `has_more` is false.
 *
 * That is expensive, which is why nothing calls it on a page load. It backs an
 * explicit "count them" action, so the cost is spent when a person asks for the
 * number and never otherwise.
 *
 * THE SWEEP IS BOUNDED
 * --------------------
 * `MAX_REQUESTS` caps the walk. A collection larger than that returns
 * `exact: false` with the count reached so far, which the caller renders as
 * "more than N" — an honest floor beats both a wrong number and a request loop
 * that eats a 200-per-window quota in one click.
 */
import { MAX_UPSTREAM_LIMIT } from './officegest.constants.js';
import type { UpstreamRecord } from './officegest.record-readers.js';
import type { OfficeGestListResult } from './officegest.types.js';

/** At 250 rows each, this covers 5 000 records — well past this workshop's data. */
const MAX_REQUESTS = 20;

/**
 * How long an unfiltered collection count stays fresh.
 *
 * The sweep is the expensive thing in this file — 6 requests for the customers
 * and 11 for the vehicles on this tenant — so the dashboard, which wants those
 * two numbers on every visit, would otherwise spend 17 upstream requests per
 * page load on data that changes a few times a day.
 *
 * Six hours makes that at most four sweeps a day, roughly 2 000 requests a
 * month against a 100 000 quota, while a staff member opening the dashboard
 * gets a number that is at worst a few hours stale — which is the right
 * trade for "how many customers do we have", and would be the wrong one for
 * anything a decision is made on.
 */
export const COUNT_TTL_MS = 6 * 60 * 60 * 1000;

export interface CountResult {
  readonly total: number;
  /** `false` when the sweep hit its cap, so `total` is a floor, not the count. */
  readonly exact: boolean;
  /** Upstream requests spent, for the log line. */
  readonly requests: number;
}

/**
 * Walks a paginated resource and counts what it holds.
 *
 * @param fetchPage Fetches one page — the resource's own `list`, bound to its
 * filters by the caller, so counting a filtered list counts the filter.
 */
export async function countAll(
  fetchPage: (page: number, perPage: number) => Promise<OfficeGestListResult<UpstreamRecord>>,
): Promise<CountResult> {
  let total = 0;

  for (let page = 1; page <= MAX_REQUESTS; page++) {
    const result = await fetchPage(page, MAX_UPSTREAM_LIMIT);
    total += result.items.length;

    // `has_more` is authoritative. The short-page heuristic is only a fallback
    // for a tenant that omits it, and it is wrong when the final page is full.
    const hasMore = result.meta?.['has_more'];
    const more =
      typeof hasMore === 'boolean' ? hasMore : result.items.length === MAX_UPSTREAM_LIMIT;

    if (!more) {
      return { total, exact: true, requests: page };
    }
  }

  return { total, exact: false, requests: MAX_REQUESTS };
}
