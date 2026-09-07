/**
 * The `entities/customers` corner of the OfficeGest API.
 *
 * A resource is the narrowest useful unit of the integration: it knows one
 * upstream path family and nothing else. Services depend on this rather than on
 * the client directly, so a service never contains a URL — which is what keeps
 * "OfficeGest moved an endpoint" a one-file change.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { FILTER_PARAMS, OFFICEGEST_PATHS } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListCustomersParams {
  readonly page: number;
  readonly perPage: number;
  /** Partial match on the customer's name. */
  readonly name?: string;
  /** Exact match on the tax number. */
  readonly taxId?: string;
  /** Exact match on the e-mail address. */
  readonly email?: string;
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
        [FILTER_PARAMS.name]: params.name,
        [FILTER_PARAMS.taxId]: params.taxId,
        [FILTER_PARAMS.email]: params.email,
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
