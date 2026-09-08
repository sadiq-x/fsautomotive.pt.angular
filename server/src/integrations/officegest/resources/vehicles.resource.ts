/**
 * The `workshop/vehicles` corner of the OfficeGest API.
 *
 * A vehicle is addressed by its registration plate rather than a surrogate id —
 * that is OfficeGest's own key for the resource (`/workshop/vehicles/{plate}`),
 * so the plate is carried through this service as the identifier instead of
 * being translated into something the upstream would not recognise.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import {
  FILTER_PARAMS,
  OFFICEGEST_PATHS,
  SORT_NEWEST_FIRST,
  SORT_PARAM,
} from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListVehiclesParams {
  readonly page: number;
  readonly perPage: number;
  /** Exact, and hyphenated — `00-00-ZZ`, not `0000ZZ`. */
  readonly plate?: string;
  /** Exact. */
  readonly vin?: string;
  /** Exact, whole-string. */
  readonly description?: string;
  /** Narrows to the cars the workshop still has on its books, or to the rest. */
  readonly isActive?: boolean;
  /**
   * Orders by creation date, newest first.
   *
   * Expressed as a flag rather than a sort expression so the upstream's
   * vocabulary stays inside this layer — see `SORT_PARAM`. Without it the
   * collection comes back in no useful order at all.
   */
  readonly newestFirst?: boolean;
}

export class VehiclesResource {
  constructor(private readonly client: OfficeGestClient) {}

  /** `GET /workshop/vehicles` */
  list(
    params: ListVehiclesParams,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.vehicles, officeGestRecordSchema, {
      ...options,
      query: {
        ...OfficeGestClient.paginationQuery(params.page, params.perPage),
        [FILTER_PARAMS.plate]: params.plate,
        [FILTER_PARAMS.vin]: params.vin,
        [FILTER_PARAMS.description]: params.description,
        [FILTER_PARAMS.isActive]: params.isActive,
        [SORT_PARAM]: params.newestFirst ? SORT_NEWEST_FIRST : undefined,
      },
    });
  }

  /** `GET /workshop/vehicles/{plate}` */
  getByPlate(plate: string, options: OfficeGestRequestOptions = {}): Promise<UpstreamRecord> {
    return this.client.getOne(
      OFFICEGEST_PATHS.vehicleByPlate(plate),
      officeGestRecordSchema,
      options,
    );
  }
}
