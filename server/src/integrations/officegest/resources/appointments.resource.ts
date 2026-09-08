/**
 * The `crm/appointments` corner of the OfficeGest API — the bookings a workshop
 * schedules with a customer.
 *
 * Read-only, like every other resource here: booking is done in OfficeGest
 * itself, and this integration never writes to the client's ERP.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { OFFICEGEST_PATHS } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListAppointmentsParams {
  readonly page: number;
  readonly perPage: number;
  readonly filters?: Readonly<Record<string, string | number | undefined>>;
}

export class AppointmentsResource {
  constructor(private readonly client: OfficeGestClient) {}

  /** `GET /crm/appointments` */
  list(
    params: ListAppointmentsParams,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.appointments, officeGestRecordSchema, {
      ...options,
      query: {
        ...OfficeGestClient.paginationQuery(params.page, params.perPage),
        ...params.filters,
      },
    });
  }

  /** `GET /crm/appointments/{id}` */
  getById(appointmentId: string, options: OfficeGestRequestOptions = {}): Promise<UpstreamRecord> {
    return this.client.getOne(
      OFFICEGEST_PATHS.appointmentById(appointmentId),
      officeGestRecordSchema,
      options,
    );
  }
}
