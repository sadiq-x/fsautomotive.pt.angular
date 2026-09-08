/**
 * Vehicle use cases.
 *
 * Two rules live here rather than in the controller.
 *
 * THE PLATE IS NORMALISED INSIDE, HYPHENATED OUTSIDE
 * --------------------------------------------------
 * A plate is normalised before it is used as a key, and the plate this API
 * returns is the normalised one, so `AA-00-BB` and `aa00bb` reach the same
 * record and come back as the same identifier. But OfficeGest keys vehicles by
 * the *hyphenated* plate, and answers 404 for anything else — verified on
 * 2026-09-08: `/workshop/vehicles/0000ZZ` is a 404 while
 * `/workshop/vehicles/00-00-ZZ` returns the record. Sending the normalised form
 * therefore made **every** vehicle detail page report "not found". The
 * conversion happens at the one point where the plate crosses into upstream.
 *
 * THE REFERENCE IDS ARE RESOLVED HERE
 * -----------------------------------
 * A record identifies its fuel, brand and version by number. The mapper stays
 * pure, so the join against those tables is done here — the layer that is
 * allowed to make requests — and `VehicleCatalogue` keeps it from costing
 * anything on all but the first request.
 */
import {
  COUNT_TTL_MS,
  countAll,
  type CountResult,
} from '../../integrations/officegest/officegest.counter.js';
import { logger as sharedLogger } from '../../shared/logger.js';
import { memoizeWithTtl } from '../../shared/ttl-memo.js';
import { readHasMore } from '../../shared/http/pagination.js';
import type { VehiclesResource } from '../../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { VehicleCatalogue, VehicleNameTables } from './vehicle-catalogue.js';
import type { ListVehiclesQuery } from './vehicle.dto.js';
import { formatPlate, isPlausiblePlate, normalisePlate } from './plate.js';
import { toVehicle, toVehicles, type RawVehicle } from './vehicle.mapper.js';
import type { Vehicle } from './vehicle.model.js';

/** A VIN is 17 characters; some older records carry a shorter chassis number. */
const VIN_PATTERN = /^[A-Z0-9]{11,17}$/;

/**
 * Resolves one search box onto the filter its content implies.
 *
 * Vehicles are the awkward resource: `plate`, `vin` and `description` are all
 * **exact** matches upstream, so there is no "type three letters of the model"
 * to offer — a partial term genuinely matches nothing, and pretending otherwise
 * is what a broken search box feels like.
 *
 * A plate is the one thing a workshop looks a car up by, so it is tried first,
 * and re-hyphenated on the way out: this codebase stores plates normalised as
 * `AA00BB`, and upstream matches only `AA-00-BB`. That single detail is why a
 * correctly-typed plate still returned nothing.
 *
 * Exported for the tests.
 */
export function toVehicleFilter(search: string | undefined): {
  plate?: string;
  vin?: string;
  description?: string;
} {
  const term = search?.trim();

  if (!term) {
    return {};
  }

  const normalised = normalisePlate(term);

  if (isPlausiblePlate(normalised)) {
    return { plate: formatPlate(normalised) };
  }

  if (VIN_PATTERN.test(normalised)) {
    return { vin: normalised };
  }

  // Exact, so it only ever matches a description pasted whole. Sent anyway:
  // the alternative is dropping the term and showing an unfiltered list, which
  // states that the search ran and found everything.
  return { description: term };
}

/** `active` / `inactive` / unfiltered, as the upstream flag expects it. */
function toIsActive(status: ListVehiclesQuery['status']): boolean | undefined {
  return status === undefined ? undefined : status === 'active';
}

export interface VehicleList {
  readonly vehicles: readonly Vehicle[];
  readonly meta: PaginationMeta;
}

export class VehiclesService {
  constructor(
    private readonly vehicles: VehiclesResource,
    private readonly catalogue: VehicleCatalogue,
  ) {}

  /**
   * The size of the whole collection, held for `COUNT_TTL_MS`.
   *
   * Shared by every caller, so it takes no request signal: one browser
   * navigating away must not cancel the sweep three other requests are waiting
   * on. It logs against the shared logger for the same reason — the sweep
   * belongs to no single request.
   */
  private readonly total = memoizeWithTtl(
    () =>
      countAll((page, perPage) => this.vehicles.list({ page, perPage }, { logger: sharedLogger })),
    COUNT_TTL_MS,
  );

  async list(query: ListVehiclesQuery, context: UseCaseContext): Promise<VehicleList> {
    // The reference tables are almost always cached, and when they are not this
    // is the one place a list waits for them — so it waits alongside the list
    // request rather than after it.
    const [result, tables] = await Promise.all([
      this.vehicles.list(
        {
          page: query.page,
          perPage: query.perPage,
          newestFirst: true,
          isActive: toIsActive(query.status),
          ...toVehicleFilter(query.search),
        },
        { logger: context.logger, signal: context.signal },
      ),
      this.catalogue.tables(context.logger),
    ]);

    return {
      vehicles: toVehicles(result.items).map((vehicle) => withNames(vehicle, tables)),
      meta: toPaginationMeta(query, result.meta?.['total'], readHasMore(result.meta)),
    };
  }

  /**
   * How many records the collection holds.
   *
   * Deliberately a separate call, not part of `list`: OfficeGest reports no
   * total, so this walks the collection, and no page load should pay for that.
   * The filters are applied, so counting a filtered list counts the filter.
   */
  async count(query: ListVehiclesQuery, context: UseCaseContext): Promise<CountResult> {
    const filter = toVehicleFilter(query.search);
    const isActive = toIsActive(query.status);

    // See the note in `CustomersService.count`: the shared, unfiltered total is
    // worth caching, a one-off filtered one is not.
    const result =
      Object.keys(filter).length > 0 || isActive !== undefined
        ? await countAll((page, perPage) =>
            this.vehicles.list(
              { page, perPage, isActive, ...filter },
              { logger: context.logger, signal: context.signal },
            ),
          )
        : await this.total.get();

    context.logger.info('counted OfficeGest vehicles', {
      total: result.total,
      exact: result.exact,
      upstreamRequests: result.requests,
    });

    return result;
  }

  async getByPlate(plate: string, context: UseCaseContext): Promise<Vehicle> {
    // Normalised again even though the DTO already did it: a use case must hold
    // its own invariants, because the next caller may not be an HTTP route.
    const normalised = normalisePlate(plate);

    // Hyphenated on the way out. See the header — this is the difference
    // between a vehicle detail page and a 404.
    const record = await this.vehicles.getByPlate(formatPlate(normalised), {
      logger: context.logger,
      signal: context.signal,
    });

    const vehicle = toVehicle(record);

    if (!vehicle) {
      context.logger.error('OfficeGest vehicle record has no usable plate', { plate: normalised });
      throw new AppError(
        502,
        ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
        'OfficeGest returned an unexpected response.',
      );
    }

    // The version is the one name that cannot be cached in bulk — the table is
    // unbounded — so it is read per vehicle, and only here: a list row has no
    // room for it and would turn one request into ten.
    const [tables, version] = await Promise.all([
      this.catalogue.tables(context.logger),
      vehicle.versionId === undefined
        ? undefined
        : this.catalogue.versionName(vehicle.versionId, context.logger),
    ]);

    return { ...withNames(vehicle, tables), version };
  }
}

/**
 * Replaces the reference ids with the names they point at.
 *
 * The ids are dropped rather than published: they mean nothing outside
 * OfficeGest, nothing links to them, and a client that received them would be
 * tempted to render one when a name could not be resolved.
 *
 * An upstream name always wins over a looked-up one — a detail record's own
 * `brand_name` is the tenant's answer, and the table is only a substitute for
 * the rows that do not carry it.
 */
function withNames(raw: RawVehicle, tables: VehicleNameTables): Vehicle {
  const { brandId, fuelId, versionId, ...vehicle } = raw;

  return {
    ...vehicle,
    brand: vehicle.brand ?? (brandId === undefined ? undefined : tables.brands.get(brandId)),
    fuel: fuelId === undefined ? undefined : tables.fuels.get(fuelId),
  };
}
