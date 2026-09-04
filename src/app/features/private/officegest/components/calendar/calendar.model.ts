/**
 * What the calendar draws, and what it hands back.
 *
 * The component knows nothing about appointments. It takes a flat list of dated
 * items and emits the one that was clicked — so the same grid can later show
 * service orders, deliveries or staff shifts without being touched. Mapping a
 * domain object onto `CalendarEvent` is the caller's job, and it is one
 * function.
 */
export interface CalendarEvent {
  readonly id: string;
  /** ISO-8601 instant. The day it lands on is resolved in the local time zone. */
  readonly startsAt: string;
  readonly endsAt?: string;
  readonly title: string;
  /** Free text from upstream; tints the pill via `StatusBadge`'s own rules. */
  readonly status?: string;
}

/** One cell of the month grid, fully resolved so the template only renders. */
export interface CalendarDay {
  readonly date: Date;
  /** `yyyy-mm-dd` in local time — the grouping key, and a stable `track`. */
  readonly key: string;
  readonly dayOfMonth: number;
  /** `false` for the leading/trailing days that pad the grid to whole weeks. */
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isWeekend: boolean;
  readonly events: readonly CalendarEvent[];
}
