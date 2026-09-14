/**
 * The `workshop/monitor` corner of the OfficeGest API — the live workshop board.
 *
 * WHY THIS IS NOT PART OF `ServiceOrdersResource`
 * -----------------------------------------------
 * It answers a different question. `/workshop/service-orders` is the ledger:
 * every job ever booked, keyed by number, paged by cursor. The monitor is the
 * board on the wall: the jobs in play right now, each with the mechanics
 * currently stood at the car and how far along it is. The two share a subject
 * and nothing else — different fields, different paging, different lifetime.
 *
 * Crucially, the monitor is the *only* place the API publishes a mechanic's
 * clock-on. A monitor row carries:
 *
 *   mechanics[]     employee_code, name, start_time, show_in_monitor
 *   interventions[] sequence_number, intervention, completed, duration
 *   root            completion_percentage, estimated_completion_date, badge_color
 *
 * Nothing under `/workshop/service-orders` carries any of it: its own nested
 * `interventions` array has three fields (`line_number`, `id`, `estimated_time`)
 * and no mechanic at all.
 *
 * PAGING — CONFIRMED 2026-09-13
 * -----------------------------
 * Unlike `/workshop/service-orders`, the monitor pages by `page` and `limit`
 * normally: `meta` carries `current_page`, `per_page` and `has_more`, and there
 * is no cursor. So this resource *can* use the shared `paginationQuery` helper,
 * and does.
 */
import { OfficeGestClient, type OfficeGestRequestOptions } from '../officegest.client.js';
import {
  MONITOR_FILTER_PARAMS,
  MONITOR_SCHEDULE_PARAMS,
  OFFICEGEST_PATHS,
} from '../officegest.constants.js';
import type { UpstreamRecord } from '../officegest.record-readers.js';
import { officeGestRecordSchema, type OfficeGestListResult } from '../officegest.types.js';

/**
 * The shop's working day, used by upstream to compute `estimated_completion_date`.
 *
 * Optional in full: the API has its own defaults (09:00–18:30, lunch
 * 13:00–14:30, weekends skipped), and sending a partial schedule is legitimate —
 * each field it does not receive falls back individually.
 */
export interface MonitorSchedule {
  /** `HH:MM`. */
  readonly startHour?: string;
  readonly endHour?: string;
  readonly lunchStart?: string;
  readonly lunchEnd?: string;
  readonly skipWeekends?: boolean;
}

export interface ListMonitorParams {
  readonly page: number;
  readonly perPage: number;
  /** A status code, or several — upstream accepts `eq` and `in`. */
  readonly status?: string;
  /** Hyphenated, as upstream matches it. */
  readonly plate?: string;
  readonly schedule?: MonitorSchedule;
}

export class WorkshopMonitorResource {
  constructor(private readonly client: OfficeGestClient) {}

  /**
   * `GET /workshop/monitor/service-orders` — the active board only.
   *
   * Upstream restricts this to the ESP/EXE/MAR states, which is why the board
   * does not have to filter by status itself: 29 rows against 1 200 on the
   * full monitor. It also adds `document_number`, `badge_color` and `budgets`.
   */
  listActive(
    params: ListMonitorParams,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.monitorServiceOrders, officeGestRecordSchema, {
      ...options,
      query: this.buildQuery(params),
    });
  }

  /**
   * `GET /workshop/mechanics` — the roster: `id`, `name`, `department_id`.
   *
   * The board names the mechanics standing at a car, so this is not needed to
   * render a running timer. It answers the other half of the question: who is
   * *not* on a car. Without it a workshop where nobody has clocked on renders
   * as an empty panel, indistinguishable from one where the feature is broken;
   * with it, the five real names appear and the screen says each is free.
   *
   * Five records on this tenant, changing perhaps twice a year, which is why
   * the service caches it far longer than the board itself.
   */
  listMechanics(
    perPage: number,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.mechanics, officeGestRecordSchema, {
      ...options,
      query: OfficeGestClient.paginationQuery(1, perPage),
    });
  }

  /**
   * `GET /tables/departments` — `id`, `name`, and the rest of the table.
   *
   * Read for one field: the name behind a mechanic's `department_id`. Four
   * records, cached beside the roster because they change at the same rate.
   */
  listDepartments(
    perPage: number,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.departments, officeGestRecordSchema, {
      ...options,
      query: OfficeGestClient.paginationQuery(1, perPage),
    });
  }

  /**
   * `GET /workshop/interventions` — the catalogue of job types.
   *
   * Read only for `description` → `estimated_time`. 218 records in one request
   * at this page size, cached beside the roster because a price list changes at
   * roughly the same rate as the staff do.
   */
  listInterventionCatalogue(
    perPage: number,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<UpstreamRecord>> {
    return this.client.getList(OFFICEGEST_PATHS.interventionCatalogue, officeGestRecordSchema, {
      ...options,
      query: OfficeGestClient.paginationQuery(1, perPage),
    });
  }

  /**
   * The upstream query for the board.
   *
   * `undefined` entries are dropped by the client's URL builder, so an absent
   * filter sends no parameter rather than an empty one — which upstream would
   * treat as "match the empty string" on the `ct` operators.
   *
   * `OFFICEGEST_PATHS.workshopMonitor` (every state, not just the active ones)
   * is deliberately not read here: it has no caller, and it stays in the
   * constants inventory as contract rather than as unused code in this file.
   */
  private buildQuery(params: ListMonitorParams): Record<string, string | number | undefined> {
    const { schedule } = params;

    return {
      ...OfficeGestClient.paginationQuery(params.page, params.perPage),
      [MONITOR_FILTER_PARAMS.status]: params.status,
      [MONITOR_FILTER_PARAMS.plate]: params.plate,
      [MONITOR_SCHEDULE_PARAMS.startHour]: schedule?.startHour,
      [MONITOR_SCHEDULE_PARAMS.endHour]: schedule?.endHour,
      [MONITOR_SCHEDULE_PARAMS.lunchStart]: schedule?.lunchStart,
      [MONITOR_SCHEDULE_PARAMS.lunchEnd]: schedule?.lunchEnd,
      // Documented as an integer flag, not a boolean literal.
      [MONITOR_SCHEDULE_PARAMS.skipWeekends]:
        schedule?.skipWeekends === undefined ? undefined : schedule.skipWeekends ? 1 : 0,
    };
  }
}
