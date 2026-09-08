/**
 * What this application may ask the backend for.
 *
 * Every field here maps to a query parameter or body field the backend
 * genuinely accepts — see `server/README.md` §5. Nothing is invented: there is
 * no `sort` parameter because the backend exposes none, which is also why the
 * table sorts the loaded page in the browser and says so. Where an ordering is
 * required rather than chosen — vehicles come back newest first — the backend
 * applies it itself, so there is nothing for a caller to pass.
 */

import type { AppointmentStatus } from './officegest.models';

/** Shared by every list endpoint. Bounds mirror the backend's own validation. */
export interface ListQuery {
  readonly page: number;
  /** Capped at 100 by the backend; asking for more is a 422. */
  readonly perPage: number;
}

/** The backend requires 2–120 characters, or the parameter omitted entirely. */
export interface SearchableListQuery extends ListQuery {
  readonly search?: string;
}

export type CustomerListQuery = SearchableListQuery;
export type EmployeeListQuery = SearchableListQuery;

/** Whether the workshop still has the car on its books. Omit for both. */
export type VehicleStatus = 'active' | 'inactive';

export interface VehicleListQuery extends SearchableListQuery {
  readonly status?: VehicleStatus;
}

export interface ServiceOrderListQuery extends ListQuery {
  /** Any casing or separator; the backend normalises it. */
  readonly plate?: string;
  /** The tenant's own status code, e.g. `FAC`. */
  readonly status?: string;
  /** ISO-8601 instants; the backend sends upstream only the date part. */
  readonly from?: string;
  readonly to?: string;
  /** Matched against number, plate, customer and description. */
  readonly search?: string;
}

export interface AppointmentListQuery extends ListQuery {
  /** ISO-8601 instants. The backend requires a range and invents one if absent. */
  readonly from?: string;
  readonly to?: string;
  readonly customerId?: string;
  /**
   * `none` selects the bookings with no state set, which is a third of the
   * diary. Omit the field for "any state".
   */
  readonly status?: AppointmentStatus | 'none';
  /** Matched against the title, location and plate, ignoring case and accents. */
  readonly search?: string;
}
