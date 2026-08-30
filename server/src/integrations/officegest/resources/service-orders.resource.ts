/**
 * The `workshop/service-orders` corner of the OfficeGest API — the repair jobs
 * (folhas de obra) a vehicle passes through.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { OFFICEGEST_PATHS } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListServiceOrdersParams {
  readonly page: number;
  readonly perPage: number;
  /**
   * Extra upstream filters, already named as OfficeGest expects them.
   *
   * The filter vocabulary for this endpoint is not published, so the service
   * layer decides what to send instead of this file pretending to know. Nothing
   * reaches here without passing a schema first.
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
        ...OfficeGestClient.paginationQuery(params.page, params.perPage),
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
