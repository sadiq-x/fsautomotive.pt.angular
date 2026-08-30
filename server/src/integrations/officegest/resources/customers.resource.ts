/**
 * The `entities/customers` corner of the OfficeGest API.
 *
 * A resource is the narrowest useful unit of the integration: it knows one
 * upstream path family and nothing else. Services depend on this rather than on
 * the client directly, so a service never contains a URL — which is what keeps
 * "OfficeGest moved an endpoint" a one-file change.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { OFFICEGEST_PATHS, SEARCH_PARAM } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListCustomersParams {
  readonly page: number;
  readonly perPage: number;
  /** Free-text filter. Sent only when present. */
  readonly search?: string;
}

export class CustomersResource {
  constructor(private readonly client: OfficeGestClient) {}

  /** `GET /entities/customers` */
  list(
    params: ListCustomersParams,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.customers, officeGestRecordSchema, {
      ...options,
      query: {
        ...OfficeGestClient.paginationQuery(params.page, params.perPage),
        [SEARCH_PARAM]: params.search,
      },
    });
  }

  /** `GET /entities/customers/{customer}` */
  getById(customerId: string, options: OfficeGestRequestOptions = {}): Promise<UpstreamRecord> {
    return this.client.getOne(
      OFFICEGEST_PATHS.customerById(customerId),
      officeGestRecordSchema,
      options,
    );
  }
}
