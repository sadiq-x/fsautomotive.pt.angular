/**
 * Vehicle use cases.
 *
 * The rule that lives here rather than in the controller: a plate is normalised
 * before it is used as an upstream key, and the plate this API returns is the
 * normalised one. Two callers asking for `AA-00-BB` and `aa00bb` must reach the
 * same record and get back the same identifier, or nothing downstream can cache
 * or compare them.
 */
import { countAll, type CountResult } from '../../integrations/officegest/officegest.counter.js';
import { readHasMore } from '../../shared/http/pagination.js';
import type { VehiclesResource } from '../../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { ListVehiclesQuery } from './vehicle.dto.js';
import { formatPlate, isPlausiblePlate, normalisePlate } from './plate.js';
import { toVehicle, toVehicles } from './vehicle.mapper.js';
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

export interface VehicleList {
  readonly vehicles: readonly Vehicle[];
  readonly meta: PaginationMeta;
}

export class VehiclesService {
  constructor(private readonly vehicles: VehiclesResource) {}

  async list(query: ListVehiclesQuery, context: UseCaseContext): Promise<VehicleList> {
    const result = await this.vehicles.list(
      { page: query.page, perPage: query.perPage, ...toVehicleFilter(query.search) },
      { logger: context.logger, signal: context.signal },
    );

    return {
      vehicles: toVehicles(result.items),
      meta: toPaginationMeta(query, result.meta?.['total'], readHasMore(result.meta)),
    };
  }

  /**
   * How many records the collection holds.
   *
   * Deliberately a separate call, not part of `list`: OfficeGest reports no
   * total, so this walks the collection, and no page load should pay for that.
   * The search filter is applied, so counting a filtered list counts the filter.
   */
  async count(query: ListVehiclesQuery, context: UseCaseContext): Promise<CountResult> {
    const result = await countAll((page, perPage) =>
      this.vehicles.list(
        { page, perPage, ...toVehicleFilter(query.search) },
        { logger: context.logger, signal: context.signal },
      ),
    );

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

    const record = await this.vehicles.getByPlate(normalised, {
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

    return vehicle;
  }
}
