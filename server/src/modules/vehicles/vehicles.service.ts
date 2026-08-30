/**
 * Vehicle use cases.
 *
 * The rule that lives here rather than in the controller: a plate is normalised
 * before it is used as an upstream key, and the plate this API returns is the
 * normalised one. Two callers asking for `AA-00-BB` and `aa00bb` must reach the
 * same record and get back the same identifier, or nothing downstream can cache
 * or compare them.
 */
import type { VehiclesResource } from '../../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { ListVehiclesQuery } from './vehicle.dto.js';
import { normalisePlate } from './plate.js';
import { toVehicle, toVehicles } from './vehicle.mapper.js';
import type { Vehicle } from './vehicle.model.js';

export interface VehicleList {
  readonly vehicles: readonly Vehicle[];
  readonly meta: PaginationMeta;
}

export class VehiclesService {
  constructor(private readonly vehicles: VehiclesResource) {}

  async list(query: ListVehiclesQuery, context: UseCaseContext): Promise<VehicleList> {
    const result = await this.vehicles.list(
      { page: query.page, perPage: query.perPage, search: query.search },
      { logger: context.logger, signal: context.signal },
    );

    return {
      vehicles: toVehicles(result.items),
      meta: toPaginationMeta(query, result.meta?.['total']),
    };
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
