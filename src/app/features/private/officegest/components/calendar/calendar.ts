import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon } from '../../../../../shared/components/icon/icon';
import type { CalendarDay, CalendarEvent } from './calendar.model';

const LOCALE = 'pt-PT';

/** Monday-first, as Portugal reads a calendar. */
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

/**
 * Always six rows.
 *
 * A month spans five or six weeks depending on where it starts, so a grid sized
 * to its content changes height as you page through the year — the buttons move
 * under the cursor. A fixed six keeps the frame still, at the cost of one
 * mostly-padding row in short months.
 */
const WEEKS_IN_GRID = 6;

/**
 * A month calendar.
 *
 * WHY THE PARENT OWNS THE MONTH
 * -----------------------------
 * `month` is an input and paging is an output, so the component never decides
 * what it is showing. That is what lets the dashboard fetch exactly the range
 * being displayed: if the calendar held the month internally, the page would
 * have to reach in and read it to know what to request, and the two would drift
 * out of step during loading.
 *
 * WHY DAYS ARE RESOLVED IN LOCAL TIME
 * -----------------------------------
 * Grouping on `startsAt.slice(0, 10)` would be a UTC day. A booking at 00:30 in
 * Lisbon summer time is `23:30Z` the day before, so half the late-evening and
 * early-morning appointments would land in the wrong cell. The date parts are
 * read locally instead, which is the day the workshop means.
 */
@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './calendar.html',
  host: { class: 'block' },
})
export class Calendar {
  /** Any instant within the month to display. */
  readonly month = input.required<Date>();
  readonly events = input<readonly CalendarEvent[]>([]);
  /** Dims the grid and announces a refresh without emptying it. */
  readonly loading = input(false);
  /** Events beyond this many in one day collapse into a "+N" count. */
  readonly maxPerDay = input(3);

  readonly monthChange = output<Date>();
  readonly selectEvent = output<CalendarEvent>();

  protected readonly weekdays = WEEKDAYS;

  /** "setembro de 2026", capitalised — `pt-PT` lowercases the month name. */
  protected readonly monthLabel = computed(() => {
    const label = this.month().toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  protected readonly isCurrentMonth = computed(() => {
    const now = new Date();
    const month = this.month();
    return now.getFullYear() === month.getFullYear() && now.getMonth() === month.getMonth();
  });

  protected readonly weeks = computed<readonly (readonly CalendarDay[])[]>(() => {
    const month = this.month();
    const byDay = this.groupByDay();
    const todayKey = toKey(new Date());

    // Back up to the Monday on or before the 1st, then walk forward.
    const cursor = startOfMonth(month);
    cursor.setDate(cursor.getDate() - mondayIndex(cursor));

    return Array.from({ length: WEEKS_IN_GRID }, () =>
      Array.from({ length: 7 }, () => {
        const date = new Date(cursor);
        const key = toKey(date);
        const weekday = date.getDay();

        cursor.setDate(cursor.getDate() + 1);

        return {
          date,
          key,
          dayOfMonth: date.getDate(),
          inMonth: date.getMonth() === month.getMonth(),
          isToday: key === todayKey,
          isWeekend: weekday === 0 || weekday === 6,
          events: byDay.get(key) ?? [],
        } satisfies CalendarDay;
      }),
    );
  });

  protected readonly total = computed(() => this.events().length);

  protected previous(): void {
    this.monthChange.emit(shiftMonth(this.month(), -1));
  }

  protected next(): void {
    this.monthChange.emit(shiftMonth(this.month(), 1));
  }

  protected today(): void {
    this.monthChange.emit(startOfMonth(new Date()));
  }

  /** The events a cell shows, and how many it had to hide. */
  protected visible(day: CalendarDay): readonly CalendarEvent[] {
    return day.events.slice(0, this.maxPerDay());
  }

  protected hidden(day: CalendarDay): number {
    return Math.max(0, day.events.length - this.maxPerDay());
  }

  /** `09:30`, or nothing when the instant is unusable. */
  protected time(event: CalendarEvent): string {
    const date = new Date(event.startsAt);

    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  }

  protected label(day: CalendarDay): string {
    return day.date.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  /**
   * Buckets the events by local day, each bucket ordered by time.
   *
   * An event whose `startsAt` will not parse is dropped rather than bucketed
   * under `Invalid Date`: a cell that cannot say *when* is noise on a calendar,
   * and the list page still shows the record.
   */
  private groupByDay(): ReadonlyMap<string, readonly CalendarEvent[]> {
    const buckets = new Map<string, CalendarEvent[]>();

    for (const event of this.events()) {
      const date = new Date(event.startsAt);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = toKey(date);
      const bucket = buckets.get(key);

      if (bucket) {
        bucket.push(event);
      } else {
        buckets.set(key, [event]);
      }
    }

    for (const bucket of buckets.values()) {
      bucket.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }

    return buckets;
  }
}

/** Local `yyyy-mm-dd`. Deliberately not `toISOString`, which converts to UTC. */
function toKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** `getDay()` is Sunday-based; this is the 0-6 offset from Monday. */
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Moves whole months without the end-of-month trap: `new Date(2026, 0, 31)`
 * plus one month is 3 March, because February has no 31st. Building from the
 * 1st avoids it entirely.
 */
function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
