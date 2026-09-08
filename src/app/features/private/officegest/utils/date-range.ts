/**
 * The date windows the list pages default to.
 *
 * Shared because two screens now need the same one and would otherwise each
 * grow their own copy — and the copies would drift, because "the current month"
 * has three fiddly details in it: the last day varies, the end must include the
 * whole of that day, and both ends are local dates that the backend wants as
 * instants.
 */

/** A window, as the ISO instants the backend's `from` / `to` expect. */
export interface DateRange {
  readonly from: string;
  readonly to: string;
}

/**
 * The current calendar month, from the local clock.
 *
 * Built on every call rather than computed once at module load: a tab left open
 * across midnight on the 1st would otherwise keep asking for last month.
 *
 * Day `0` of the next month is the last day of this one, which is the standard
 * way to get 28, 29, 30 or 31 right without a table of month lengths and a
 * leap-year bug every four years.
 */
export function currentMonth(now: Date = new Date()): DateRange {
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Whether a window is exactly the current calendar month.
 *
 * What the "reset filters" affordance keys off: it should appear when the user
 * has narrowed something, and stay hidden when they are looking at the default.
 */
export function isCurrentMonth(range: Partial<DateRange>, now: Date = new Date()): boolean {
  const month = currentMonth(now);

  return range.from === month.from && range.to === month.to;
}
