/**
 * A CRM appointment (marcação), as this API publishes it.
 *
 * WHICH FIELDS A TENANT ACTUALLY SENDS
 * ------------------------------------
 * Probed against the live tenant on 2026-09-08 (`npm run probe -- /crm/appointments
 * start=… end=…`). A record carries exactly: `id`, `title`, `start`, `end`, the
 * three state booleans, `employee_id`, `priority`, `location`, `no_show_at` and
 * `rescheduled_from`.
 *
 * `customerId`, `plate` and `notes` are **not** among them. They stay in the
 * model because the mapper still looks for them under several names and another
 * tenant may well send them — but nothing in the UI may assume they exist, which
 * is why every renderer omits an absent field rather than printing a dash.
 *
 * `noShowAt` and `rescheduledFrom` are deliberately *not* mapped: they were null
 * on all 287 records in the tenant's 2026 diary, so publishing them would add
 * two permanently empty fields to every screen.
 */
export interface Appointment {
  readonly id: string;
  readonly title?: string;
  readonly customerId?: string;
  readonly plate?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  /** Folded from the upstream booleans — see `deriveStatus`. */
  readonly status?: AppointmentStatus;
  readonly notes?: string;
  /** The member of staff the booking is assigned to, when one is set. */
  readonly employeeId?: string;
  /** Upstream's own code: `N` normal, `H` high. Published verbatim. */
  readonly priority?: string;
  /** Free text, e.g. `[1] Sede`. */
  readonly location?: string;
}

/**
 * The states a booking can be in.
 *
 * A closed union rather than `string`, because the whole set is derived here
 * from three booleans — so it is knowable, and a filter that accepts anything
 * else is a filter that silently returns nothing.
 */
export const APPOINTMENT_STATUSES = ['confirmed', 'completed', 'no_show'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
