/**
 * The `entities/employees` corner of the OfficeGest API — the company's staff.
 *
 * VERIFIED against the tenant on 2026-09-07: the path exists, returns the whole
 * roster (12 records, `has_more: false`) and is the *only* staff resource the
 * API publishes — `/entities/users`, `/users` and `/hr/employees` all 404. It
 * carries both HR facts (name, address, department) and login facts (`login`,
 * `web_active`, `permissions_group`), so this one endpoint answers both
 * readings of "workers".
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import { FILTER_PARAMS, OFFICEGEST_PATHS } from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

export interface ListEmployeesParams {
  readonly page: number;
  readonly perPage: number;
  /** Partial match on the employee's name. */
  readonly name?: string;
}

export class EmployeesResource {
  constructor(private readonly client: OfficeGestClient) {}

  /** `GET /entities/employees` */
  list(
    params: ListEmployeesParams,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.employees, officeGestRecordSchema, {
      ...options,
      query: {
        ...OfficeGestClient.paginationQuery(params.page, params.perPage),
        [FILTER_PARAMS.name]: params.name,
      },
    });
  }
}
