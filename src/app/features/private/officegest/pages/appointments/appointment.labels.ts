/**
 * How a booking's coded fields are written for a person.
 *
 * Shared by the list and the detail page, which must agree: a booking shown as
 * "Concluída" in the table and "completed" on its own page reads as two
 * different records. Keeping the maps here is also what makes the status filter
 * and the status column impossible to drift apart — both are built from
 * `STATUS_OPTIONS`.
 */
import { APPOINTMENT_STATUSES, type AppointmentStatus } from '../../models';

/** The value the status filter sends for "has no state at all". */
export const NO_STATUS = 'none';

export type StatusFilterValue = AppointmentStatus | typeof NO_STATUS;

const STATUS_LABELS: Readonly<Record<AppointmentStatus, string>> = {
  confirmed: 'Confirmada',
  completed: 'Concluída',
  no_show: 'Faltou',
};

/**
 * Upstream's priority codes.
 *
 * `N` and `H` are the only two the tenant uses — 284 and 2 of 287 bookings, the
 * rest unset. An unknown code is shown verbatim rather than hidden: inventing a
 * label for something we have not seen would be a guess printed as fact.
 */
const PRIORITY_LABELS: Readonly<Record<string, string>> = {
  N: 'Normal',
  H: 'Alta',
};

/** Every choice the status filter offers, in the order it offers them. */
export const STATUS_OPTIONS: readonly {
  readonly value: StatusFilterValue;
  readonly label: string;
}[] = [
  ...APPOINTMENT_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
  // Last, because it is the odd one out: a third of the diary has no state,
  // and it is a real thing to filter for rather than the absence of a filter.
  { value: NO_STATUS, label: 'Sem estado' },
];

/** `completed` → `Concluída`. `null` when the booking has no state. */
export function formatStatus(status: AppointmentStatus | undefined): string | null {
  return status ? STATUS_LABELS[status] : null;
}

/** `N` → `Normal`. An unrecognised code is returned as it arrived. */
export function formatPriority(priority: string | undefined): string | null {
  const code = priority?.trim().toUpperCase();

  if (!code) {
    return null;
  }

  return PRIORITY_LABELS[code] ?? code;
}
