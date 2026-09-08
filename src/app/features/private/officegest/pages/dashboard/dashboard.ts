import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, type Observable } from 'rxjs';

import { AuthService } from '../../../../../core/auth';
import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import type { IconName, Paged } from '../../../../../core/models';
import { Icon } from '../../../../../shared/components/icon/icon';
import { PRIVATE_NAV, type PrivateNavItem } from '../../../layout/private-nav.data';
import { Calendar } from '../../components/calendar/calendar';
import type { CalendarEvent } from '../../components/calendar/calendar.model';
import type { Appointment, ResourceCount } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';

/** A headline number, or the reason there isn't one. */
interface Metric {
  readonly value: number | null;
  /** `false` when the count hit its cap upstream, so `value` is a floor. */
  readonly exact: boolean;
  readonly loading: boolean;
  readonly failed: boolean;
}

const PENDING: Metric = { value: null, exact: true, loading: true, failed: false };
const FAILED: Metric = { value: null, exact: true, loading: false, failed: true };

/**
 * The landing page of the private area.
 *
 * WHERE THE NUMBERS COME FROM
 * ---------------------------
 * There is no statistics endpoint, and inventing one would mean inventing a
 * backend. So each tile is built from what the API genuinely provides — and
 * that differs by resource, which is why they are not fetched the same way.
 *
 * The bookings tile asks the list endpoint for a single row and reads
 * `meta.total`. That works because the backend gathers the whole date window
 * itself to sort it, so it knows the total as a by-product.
 *
 * The customers and vehicles tiles cannot do that: OfficeGest reports no total
 * on those endpoints at all — no `total`, no `last_page`, only `has_more` — so
 * `meta.total` was always `undefined` and both tiles rendered a permanent dash.
 * The only way to a real number is the backend's count endpoint, which walks
 * the collection; it caches the answer for six hours, so the sweep is paid once
 * a session rather than once a visit.
 *
 * A count can still come back inexact when the sweep hits its cap, and that is
 * shown as "mais de N" rather than as a number the data does not support.
 *
 * Each tile fails independently. One endpoint being down leaves the other
 * numbers and the whole navigation working.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Calendar, Icon, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly officegest = inject(OfficeGestService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly routes = PRIVATE_ROUTES;
  protected readonly user = this.auth.user;

  /** Everything except the dashboard itself, filtered by permission. */
  protected readonly shortcuts = computed<readonly PrivateNavItem[]>(() => {
    this.auth.user();

    return PRIVATE_NAV.filter(
      (item) => !item.exact && (!item.permission || this.auth.hasPermission(item.permission)),
    );
  });

  protected readonly customers = this.track(this.officegest.countCustomers().pipe(map(fromCount)));

  protected readonly vehicles = this.track(this.officegest.countVehicles().pipe(map(fromCount)));

  protected readonly appointments = this.track(
    this.officegest
      .listAppointments({
        page: 1,
        perPage: 1,
        // From now on: the useful count is what is still to come, not the archive.
        from: new Date().toISOString(),
      })
      .pipe(map(fromPage)),
  );

  /**
   * Typed here rather than in the template, so `IconName` survives — and the
   * number is formatted here too, so the template only ever prints a string.
   */
  protected readonly tiles = computed<readonly Tile[]>(() => {
    const metrics: readonly Omit<Tile, 'text'>[] = [
      { label: 'Clientes', icon: 'users', metric: this.customers() },
      { label: 'Veículos', icon: 'car', metric: this.vehicles() },
      { label: 'Marcações futuras', icon: 'calendar', metric: this.appointments() },
    ];

    return metrics.map((tile) => ({ ...tile, text: format(tile.metric) }));
  });

  /* ------------------------------------------------------------------ */
  /* Calendar                                                            */
  /* ------------------------------------------------------------------ */

  /** The month on screen. Owned here so the fetch can follow it. */
  protected readonly visibleMonth = signal(startOfMonth(new Date()));

  protected readonly canSeeCalendar = computed(() => {
    this.auth.user();
    return this.auth.hasPermission('officegest.appointments.read');
  });

  /**
   * The appointments of the visible month.
   *
   * Refetched on every page because the alternative — loading a year up front —
   * spends the caller's rate limit on months nobody opens. `switchMap` drops the
   * response for a month the user has already paged past, which matters when
   * clicking through quickly on a slow link.
   *
   * `perPage` is the backend's maximum. A month with more than 100 bookings
   * would silently show only the first 100; the count beside the calendar is
   * what would make that visible, and it is drawn from the same response.
   */
  private readonly monthEvents = toSignal(
    toObservable(this.visibleMonth).pipe(
      switchMap((month) =>
        this.officegest
          .listAppointments({
            page: 1,
            perPage: 100,
            from: month.toISOString(),
            to: endOfMonth(month).toISOString(),
          })
          .pipe(
            map((page): CalendarState => ({ status: 'ready', events: page.items.map(toEvent) })),
            catchError(() => of<CalendarState>({ status: 'error', events: [] })),
            startWith<CalendarState>({ status: 'loading', events: [] }),
          ),
      ),
    ),
    { initialValue: { status: 'loading', events: [] } as CalendarState },
  );

  protected readonly calendarEvents = computed(() => this.monthEvents().events);
  protected readonly calendarLoading = computed(() => this.monthEvents().status === 'loading');
  protected readonly calendarFailed = computed(() => this.monthEvents().status === 'error');

  protected onMonthChange(month: Date): void {
    this.visibleMonth.set(month);
  }

  /** A booking on the grid is a link to its record; the calendar is a way in. */
  protected async onSelectEvent(event: CalendarEvent): Promise<void> {
    await this.router.navigateByUrl(PRIVATE_ROUTES.appointment(event.id));
  }

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.user()?.name.split(' ')[0] ?? '';
    const salutation = hour < 12 ? 'Bom dia' : hour < 20 ? 'Boa tarde' : 'Boa noite';

    return name ? `${salutation}, ${name}` : salutation;
  });

  /** Follows one tile's request, without ever throwing. */
  private track(source: Observable<Metric>) {
    return toSignal(
      source.pipe(
        catchError(() => of(FAILED)),
        startWith(PENDING),
      ),
      { initialValue: PENDING },
    );
  }
}

/** A tile, with its number already rendered. */
interface Tile {
  readonly label: string;
  readonly icon: IconName;
  readonly metric: Metric;
  /** `null` when there is no number to show — see `format`. */
  readonly text: string | null;
}

/** A counted collection: an exact size, or a floor when the sweep hit its cap. */
function fromCount(count: ResourceCount): Metric {
  return { value: count.total, exact: count.exact, loading: false, failed: false };
}

/**
 * A list response that reports its own total.
 *
 * `total` is genuinely absent on some endpoints, and a tile that cannot be
 * counted says so with a dash rather than a zero: "we could not count this" and
 * "there are none" are different statements, and only one of them is alarming.
 */
function fromPage<T>(page: Paged<T>): Metric {
  return { value: page.pagination.total ?? null, exact: true, loading: false, failed: false };
}

/** The number as it should read, or `null` when there is none to show. */
function format(metric: Metric): string | null {
  if (metric.value === null) {
    return null;
  }

  const total = metric.value.toLocaleString('pt-PT');

  return metric.exact ? total : `mais de ${total}`;
}

/** What the calendar section is doing, in one value. */
interface CalendarState {
  readonly status: 'loading' | 'ready' | 'error';
  readonly events: readonly CalendarEvent[];
}

/**
 * An appointment as the calendar wants it.
 *
 * A booking with no `startsAt` cannot be placed on a day; it keeps the empty
 * string and the calendar drops it while grouping, so it never lands in a
 * wrong cell. It remains visible on the list page, which does not need a date.
 */
function toEvent(appointment: Appointment): CalendarEvent {
  return {
    id: appointment.id,
    startsAt: appointment.startsAt ?? '',
    endsAt: appointment.endsAt,
    title: appointment.title?.trim() || 'Marcação',
    status: appointment.status,
  };
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** The last instant of the month, so a booking late on the 31st is included. */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
