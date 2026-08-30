/**
 * The `crm/appointments` corner of the OfficeGest API — the bookings a workshop
 * schedules with a customer.
 *
 * This is the only resource here with a write path, and it is the reason the
 * client distinguishes idempotent from non-idempotent methods: a retried `POST`
 * would book the same slot twice.
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

  /**
   * `POST /crm/appointments`
   *
   * The request body is built by the service from a validated DTO; this method
   * forwards it verbatim because the accepted field names are OfficeGest's, not
   * ours, and inventing a translation here would be guessing twice.
   */
  create(
    payload: Readonly<Record<string, unknown>>,
    options: OfficeGestRequestOptions = {},
  ): Promise<UpstreamRecord> {
    return this.client.postOne(OFFICEGEST_PATHS.appointments, officeGestRecordSchema, {
      ...options,
      body: payload,
    });
  }
}
