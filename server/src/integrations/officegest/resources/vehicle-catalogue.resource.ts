/**
 * The workshop's reference tables for vehicles: fuels, brands and versions.
 *
 * WHY THIS RESOURCE EXISTS
 * ------------------------
 * A vehicle record identifies its fuel, brand, model and version by number and
 * carries no names for them — `fuel_id: 17` and nothing else. Every one of
 * those fields is therefore unreadable until it is joined against the table it
 * points at, which is what this resource fetches.
 *
 * WHY THE TABLES ARE READ TWO DIFFERENT WAYS
 * ------------------------------------------
 * Because they differ in size by two orders of magnitude (measured against the
 * tenant on 2026-09-08):
 *
 *   fuels     34 rows  → one request, cached whole
 *   brands    65 rows  → one request, cached whole
 *   models  7 750 rows → 31 requests, so never swept: the detail endpoint
 *                        already returns `model_name`, and a list row falls
 *                        back to the tenant's own `description`
 *   versions  cursor-paged, unbounded → read one row at a time by id
 *
 * Sweeping the two small tables costs two requests an hour against a metered
 * quota and makes every row on every page readable. Sweeping the other two
 * would cost thirty-one requests to decorate ten rows.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { MAX_UPSTREAM_LIMIT, OFFICEGEST_PATHS } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export class VehicleCatalogueResource {
  constructor(private readonly client: OfficeGestClient) {}

  /** `GET /workshop/fuels` — the whole table, 34 rows on this tenant. */
  listFuels(options: OfficeGestRequestOptions = {}): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.listAll(OFFICEGEST_PATHS.fuels, options);
  }

  /** `GET /workshop/brands` — the whole table, 65 rows on this tenant. */
  listBrands(
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.listAll(OFFICEGEST_PATHS.brands, options);
  }

  /** `GET /workshop/versions/{id}` — one row, because the table is unbounded. */
  getVersion(version: string, options: OfficeGestRequestOptions = {}): Promise<UpstreamRecord> {
    return this.client.getOne(
      OFFICEGEST_PATHS.versionById(version),
      officeGestRecordSchema,
      options,
    );
  }

  /**
   * One page at the largest limit the API honours.
   *
   * Deliberately not a cursor loop: this is only ever called for the two tables
   * that are known to fit in a single page. The meta is returned rather than
   * dropped so `VehicleCatalogue` can say so if `has_more` ever turns up —
   * a table that outgrows one request should surface as a warning, not as
   * names that quietly stop resolving.
   */
  private listAll(
    path: string,
    options: OfficeGestRequestOptions,
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(path, officeGestRecordSchema, {
      ...options,
      query: OfficeGestClient.paginationQuery(1, MAX_UPSTREAM_LIMIT),
    });
  }
}
