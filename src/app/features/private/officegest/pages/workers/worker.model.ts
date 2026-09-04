/**
 * A member of the workshop team.
 *
 * WHY THIS IS NOT IN `officegest/models`
 * --------------------------------------
 * Those models mirror the backend's own module models field for field, and are
 * a standing obligation to keep in step with it. This one mirrors
 * nothing: OfficeGest publishes customers, vehicles, service orders and
 * appointments, and no staff resource — so a `Worker` in that folder would
 * imply a contract that does not exist.
 *
 * Optional fields are optional for the same reason they are everywhere else:
 * the roster is maintained by hand and a mechanic may have no direct e-mail.
 */
export interface Worker {
  readonly id: string;
  readonly name: string;
  /** What they do, e.g. "Chefe de oficina". */
  readonly role: string;
  readonly speciality?: string;
  readonly email?: string;
  readonly phone?: string;
  /** ISO date they joined; shown as a year. */
  readonly since?: string;
  readonly active?: boolean;
}
