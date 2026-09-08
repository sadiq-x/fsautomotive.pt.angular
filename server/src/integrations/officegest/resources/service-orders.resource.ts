/**
 * The `workshop/service-orders` corner of the OfficeGest API — the repair jobs
 * (folhas de obra) a vehicle passes through.
 *
 * ⚠️ THIS ENDPOINT PAGES DIFFERENTLY FROM EVERY OTHER ONE
 * -------------------------------------------------------
 * CONFIRMED against the tenant on 2026-09-08:
 *
 * - `page` is **ignored**. `page=1`, `page=2` and `page=3` return byte-identical
 *   records. Anything built on page numbers here silently re-reads page one.
 * - `per_page` is **ignored** too; the size parameter is `limit`.
 * - Paging is by cursor: the response's `meta.next` is an opaque token that is
 *   sent back as `cursor` to get the following records. It decodes to
 *   `{"number":…,"__isNext":true}`, i.e. a keyset on the record number.
 *
 * That is why this resource takes `limit` and `cursor` rather than the
 * `page`/`perPage` pair `OfficeGestClient.paginationQuery` produces: using the
 * shared helper here would compile, run, and quietly return the same fifteen
 * records for every page the caller asked for.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { OFFICEGEST_PATHS } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListServiceOrdersParams {
  /** Records per request. The upstream maximum observed is 100. */
  readonly limit: number;
  /** `meta.next` from the previous response. Omit for the first request. */
  readonly cursor?: string;
  /**
   * Extra upstream filters, already named as OfficeGest expects them.
   *
   * The service layer decides what to send instead of this file pretending to
   * know. Nothing reaches here without passing a schema first.
   */
  readonly filters?: Readonly<Record<string, string | number | undefined>>;
}

export class ServiceOrdersResource {
  constructor(private readonly client: OfficeGestClient) {}

  /** `GET /workshop/service-orders` */
  list(
    params: ListServiceOrdersParams,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.serviceOrders, officeGestRecordSchema, {
      ...options,
      query: {
        limit: params.limit,
        cursor: params.cursor,
        ...params.filters,
      },
    });
  }

  /** `GET /workshop/service-orders/{serviceOrder}` */
  getById(serviceOrderId: string, options: OfficeGestRequestOptions = {}): Promise<UpstreamRecord> {
    return this.client.getOne(
      OFFICEGEST_PATHS.serviceOrderById(serviceOrderId),
      officeGestRecordSchema,
      options,
    );
  }
}

/**
 * The cursor for the next batch, or `undefined` when the listing is complete.
 *
 * Lives beside the resource because `meta.next` is this endpoint's paging
 * contract, and reading it in the service would spread that knowledge across
 * two layers.
 */
export function nextCursor(meta: Record<string, unknown> | undefined): string | undefined {
  const next = meta?.['next'];

  return typeof next === 'string' && next !== '' ? next : undefined;
}
