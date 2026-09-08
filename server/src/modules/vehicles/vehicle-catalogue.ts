/**
 * Names for the numbers a vehicle record carries.
 *
 * A vehicle arrives as `fuel_id: 17`, `brand_id: 42`, `version_id: 900`. This
 * turns those into "Diesel", "Renault" and "1.5 dCi" — and does it without
 * making a page load pay for the join every time.
 *
 * WHY A CACHE
 * -----------
 * The reference tables are effectively static: fuels and brands change perhaps
 * twice a year, while the vehicle list is read all day. Fetching them per
 * request would add two upstream calls to every page of ten rows, against a
 * metered quota, to obtain an answer that was already known. So they are
 * fetched once, held for `TABLE_TTL_MS`, and shared by every request in that
 * window — see `memoizeWithTtl`, which also collapses concurrent callers onto
 * a single fetch and never remembers a failure.
 *
 * WHY A FAILURE IS NOT AN ERROR
 * -----------------------------
 * A vehicle list that renders without the fuel column is useful. One that
 * fails because a *decoration* could not be fetched is not — and these tables
 * sit behind their own upstream permission, so a 403 here must never take the
 * page down. Every failure resolves to "no names", is logged once, and is
 * retried on the next request rather than cached as a negative answer.
 */
import type { VehicleCatalogueResource } from '../../integrations/officegest/index.js';
import { readNumber, readString } from '../../integrations/officegest/officegest.record-readers.js';
import { logger as sharedLogger, type Logger } from '../../shared/logger.js';
import { memoizeWithTtl, type TtlMemo } from '../../shared/ttl-memo.js';

/** Reference tables change a couple of times a year; six hours is generous. */
const TABLE_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * How many version names are kept.
 *
 * Versions are read one at a time and there is no bound on how many exist, so
 * the map needs a ceiling or a long-running process would accumulate one entry
 * per vehicle ever viewed. The oldest entry is dropped when it is reached,
 * which for a lookup this cheap is all the eviction policy that is warranted.
 */
const MAX_CACHED_VERSIONS = 500;

const ID_FIELDS = ['id'] as const;
const NAME_FIELDS = ['name', 'nome', 'description'] as const;

/** The two tables that are small enough to hold whole. */
export interface VehicleNameTables {
  readonly fuels: ReadonlyMap<number, string>;
  readonly brands: ReadonlyMap<number, string>;
}

const EMPTY_TABLES: VehicleNameTables = { fuels: new Map(), brands: new Map() };

export class VehicleCatalogue {
  private readonly versions = new Map<number, string | undefined>();
  private readonly memo: TtlMemo<VehicleNameTables>;

  constructor(
    private readonly catalogue: VehicleCatalogueResource,
    now: () => number = Date.now,
  ) {
    this.memo = memoizeWithTtl(() => this.load(), TABLE_TTL_MS, now);
  }

  /**
   * The fuel and brand tables, from cache when they are still fresh.
   *
   * Never rejects: a page that renders without a fuel name is useful, one that
   * fails because a decoration could not be fetched is not.
   */
  async tables(logger: Logger): Promise<VehicleNameTables> {
    try {
      return await this.memo.get();
    } catch (error) {
      logger.warn('could not read the OfficeGest vehicle reference tables', {
        reason: error instanceof Error ? error.message : String(error),
      });

      // Not cached by the memo either, so the next request tries again.
      return EMPTY_TABLES;
    }
  }

  /**
   * One version's name, or `undefined` when it cannot be established.
   *
   * Cached including the misses, because a version id that does not resolve
   * today will not resolve on the next page view either, and re-asking would
   * add an upstream request to every render of the same vehicle.
   */
  async versionName(versionId: number, logger: Logger): Promise<string | undefined> {
    if (this.versions.has(versionId)) {
      return this.versions.get(versionId);
    }

    let name: string | undefined;

    try {
      const record = await this.catalogue.getVersion(String(versionId), { logger });
      name = readString(record, NAME_FIELDS);
    } catch (error) {
      logger.warn('could not read the OfficeGest vehicle version', {
        versionId,
        reason: error instanceof Error ? error.message : String(error),
      });

      // Not cached: unlike a version that genuinely has no name, a failure is
      // worth retrying once the upstream recovers.
      return undefined;
    }

    if (this.versions.size >= MAX_CACHED_VERSIONS) {
      const oldest = this.versions.keys().next();

      if (!oldest.done) {
        this.versions.delete(oldest.value);
      }
    }

    this.versions.set(versionId, name);

    return name;
  }

  /** Drops everything held, so the next read fetches again. */
  clear(): void {
    this.memo.clear();
    this.versions.clear();
  }

  /**
   * One load, shared by every caller waiting on it.
   *
   * It logs against the shared logger rather than a request's own, because the
   * fetch belongs to none of them in particular: whichever request happens to
   * arrive first triggers it and the rest read its result. Stamping it with
   * that one request's id would attribute a shared cost to an arbitrary
   * caller. Failures are still reported to the request that saw them, in
   * `tables` above.
   */
  private async load(): Promise<VehicleNameTables> {
    // Two independent tables, so they are fetched together rather than one
    // after the other — this is the only place a page load can wait on them.
    const [fuels, brands] = await Promise.all([
      this.catalogue.listFuels({ logger: sharedLogger }),
      this.catalogue.listBrands({ logger: sharedLogger }),
    ]);

    for (const [table, result] of [
      ['fuels', fuels],
      ['brands', brands],
    ] as const) {
      if (result.meta?.['has_more'] === true) {
        sharedLogger.warn('OfficeGest reference table no longer fits in one request', { table });
      }
    }

    return { fuels: toNameMap(fuels.items), brands: toNameMap(brands.items) };
  }
}

/** `[{ id: 17, name: 'Diesel' }]` → `Map { 17 => 'Diesel' }`. */
function toNameMap(
  records: readonly Readonly<Record<string, unknown>>[],
): ReadonlyMap<number, string> {
  const names = new Map<number, string>();

  for (const record of records) {
    const id = readNumber(record, ID_FIELDS);
    const name = readString(record, NAME_FIELDS);

    // A row with no id cannot be joined to anything, and one with no name has
    // nothing to contribute — both are skipped rather than stored as blanks.
    if (id !== undefined && name !== undefined) {
      names.set(id, name);
    }
  }

  return names;
}
