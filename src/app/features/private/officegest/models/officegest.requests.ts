/**
 * What this application may ask the backend for.
 *
 * Every field here maps to a query parameter or body field the backend
 * genuinely accepts — see `server/README.md` §5. Nothing is invented: there is
 * no `sort` parameter because the backend has none, which is also why the table
 * sorts the loaded page in the browser and says so.
 */

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
export type VehicleListQuery = SearchableListQuery;

export interface ServiceOrderListQuery extends ListQuery {
  /** Any casing or separator; the backend normalises it. */
  readonly plate?: string;
  readonly status?: string;
}

export interface AppointmentListQuery extends ListQuery {
  /** ISO-8601 instants. */
  readonly from?: string;
  readonly to?: string;
  readonly customerId?: string;
}

/** Body of `POST /api/officegest/appointments`. */
export interface CreateAppointmentRequest {
  /** 3–160 characters. */
  readonly title: string;
  /** ISO-8601, and the backend rejects anything in the past. */
  readonly startsAt: string;
  readonly endsAt?: string;
  readonly customerId?: string;
  readonly plate?: string;
  readonly notes?: string;
}
