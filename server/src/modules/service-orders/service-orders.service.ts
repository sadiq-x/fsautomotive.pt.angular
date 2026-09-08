/**
 * Service-order use cases.
 *
 * WHAT THIS LAYER IS FOR, ON THIS RESOURCE
 * ----------------------------------------
 * `/workshop/service-orders` pages by cursor and ignores `page` entirely (see
 * `service-orders.resource.ts`). A caller asking for "page 3, sorted by date,
 * matching «travões»" is therefore asking for something upstream cannot do at
 * all. This is where that gap is closed: the date window is fetched by
 * following cursors, then ordered, searched and cut into the page the caller
 * asked for.
 *
 * WHY THAT IS AFFORDABLE
 * ----------------------
 * The window is a month by default and the tenant books about 23 jobs a month —
 * one upstream request at `limit=100`. A full year is 621 records and seven
 * requests, which is the worst case anyone can produce from the UI.
 * `MAX_WINDOW_REQUESTS` bounds it regardless.
 */
import { nextCursor, type ServiceOrdersResource } from '../../integrations/officegest/index.js';
import { AppError, BadRequestError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import { formatPlate, normalisePlate } from '../vehicles/plate.js';
import type { ListServiceOrdersQuery } from './service-order.dto.js';
import { toServiceOrder, toServiceOrders } from './service-order.mapper.js';
import type { ServiceOrder } from './service-order.model.js';

/**
 * Upstream filter parameter names, CONFIRMED on 2026-09-08 by comparing result
 * sets with and without each one.
 *
 * `date_from` / `date_to` narrow correctly and leak nothing outside the range.
 * `status` accepts the tenant's own three-letter codes. The names that do *not*
 * work, and were tried: `start`/`end`, `from`/`to`, `start_date`/`end_date`,
 * `date`, `search`, `q`, `offset`, `page`.
 */
const UPSTREAM_FILTERS = {
  plate: 'plate',
  status: 'status',
  from: 'date_from',
  to: 'date_to',
} as const;

/** Upstream's maximum page size. `per_page` is ignored; `limit` is the name. */
const WINDOW_PAGE_SIZE = 100;

/**
 * A hard stop on cursor-following.
 *
 * Seven requests covers this tenant's entire year, so reaching this means the
 * caller asked for a range far beyond what the screen offers.
 */
const MAX_WINDOW_REQUESTS = 15;

export interface ServiceOrderList {
  readonly serviceOrders: readonly ServiceOrder[];
  readonly meta: PaginationMeta;
}

export class ServiceOrdersService {
  constructor(private readonly serviceOrders: ServiceOrdersResource) {}

  async list(query: ListServiceOrdersQuery, context: UseCaseContext): Promise<ServiceOrderList> {
    if (query.from && query.to && Date.parse(query.from) > Date.parse(query.to)) {
      throw new BadRequestError('`from` must not be later than `to`.');
    }

    const window = await this.collectWindow(query, context);
    // `filter` returns a fresh array, so sorting it in place is safe.
    const ordered = window.filter((order) => matchesSearch(order, query.search)).sort(byMostRecent);

    const offset = (query.page - 1) * query.perPage;
    const page = ordered.slice(offset, offset + query.perPage);

    return {
      serviceOrders: page,
      meta: toPaginationMeta(query, ordered.length, offset + page.length < ordered.length),
    };
  }

  async getById(serviceOrderId: string, context: UseCaseContext): Promise<ServiceOrder> {
    const record = await this.serviceOrders.getById(serviceOrderId, {
      logger: context.logger,
      signal: context.signal,
    });

    const serviceOrder = toServiceOrder(record);

    if (!serviceOrder) {
      context.logger.error('OfficeGest service order has no usable identifier', { serviceOrderId });
      throw new AppError(
        502,
        ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
        'OfficeGest returned an unexpected response.',
      );
    }

    return serviceOrder;
  }

  /**
   * Every job matching the upstream-expressible filters, by following cursors.
   *
   * The plate is sent in its *hyphenated* form. This is not cosmetic: the
   * endpoint matches `61-SQ-64` and returns nothing at all for `61SQ64`, so
   * forwarding the normalised plate — which is what this service stores and
   * what every other module uses — made the vehicle filter answer "no results"
   * for every vehicle that has any.
   */
  private async collectWindow(
    query: ListServiceOrdersQuery,
    context: UseCaseContext,
  ): Promise<readonly ServiceOrder[]> {
    const filters = {
      [UPSTREAM_FILTERS.plate]: query.plate ? formatPlate(query.plate) : undefined,
      [UPSTREAM_FILTERS.status]: query.status,
      [UPSTREAM_FILTERS.from]: query.from ? toUpstreamDate(query.from) : undefined,
      [UPSTREAM_FILTERS.to]: query.to ? toUpstreamDate(query.to) : undefined,
    };

    const collected: ServiceOrder[] = [];
    let cursor: string | undefined;

    for (let request = 1; request <= MAX_WINDOW_REQUESTS; request += 1) {
      const result = await this.serviceOrders.list(
        { limit: WINDOW_PAGE_SIZE, cursor, filters },
        { logger: context.logger, signal: context.signal },
      );

      collected.push(...toServiceOrders(result.items));
      cursor = nextCursor(result.meta);

      if (!cursor || result.items.length === 0) {
        return collected;
      }

      if (request === MAX_WINDOW_REQUESTS) {
        context.logger.warn('service-order window truncated at the request cap', {
          maxRequests: MAX_WINDOW_REQUESTS,
          collected: collected.length,
        });
      }
    }

    return collected;
  }
}

/** Upstream's date filters take `YYYY-MM-DD`; the API speaks ISO instants. */
function toUpstreamDate(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Newest first, and stable.
 *
 * A job with no date sorts last: it is the least useful row on the screen, and
 * the tie-break on the number keeps the order from wobbling between two
 * requests for the same page.
 */
function byMostRecent(a: ServiceOrder, b: ServiceOrder): number {
  const left = a.openedAt ? Date.parse(a.openedAt) : Number.NEGATIVE_INFINITY;
  const right = b.openedAt ? Date.parse(b.openedAt) : Number.NEGATIVE_INFINITY;

  return right - left || b.id.localeCompare(a.id);
}

/**
 * Free-text matching, applied here because upstream has no search parameter —
 * `search` and `q` are both ignored.
 *
 * Accent- and case-insensitive: nobody types "travões" with the diacritic into
 * a search box, and a search that misses on that is a search people stop using.
 *
 * The plate gets its own comparison for the same reason. It is *stored*
 * normalised (`61SQ64`) but *displayed* hyphenated (`61-SQ-64`), and a person
 * searching will type what the table showed them. Matching the plate on a
 * separator-stripped needle makes both forms work, which a single text
 * comparison cannot do.
 */
function matchesSearch(order: ServiceOrder, search: string | undefined): boolean {
  if (search === undefined) {
    return true;
  }

  const needle = fold(search);

  const inText = [
    order.number,
    order.customerName,
    order.description,
    order.status,
    order.statusName,
    order.id,
  ].some((field) => field !== undefined && fold(field).includes(needle));

  if (inText) {
    return true;
  }

  return order.plate !== undefined && order.plate.includes(normalisePlate(search));
}

/** A comparison key: trimmed, lower-cased and stripped of diacritics. */
function fold(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
