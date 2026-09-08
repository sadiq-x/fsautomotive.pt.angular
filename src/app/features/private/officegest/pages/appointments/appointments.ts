import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { Icon } from '../../../../../shared/components/icon/icon';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { Appointment } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { currentMonth, isCurrentMonth } from '../../utils/date-range';
import { formatDateTime, formatPlate, orNull } from '../../utils/format';
import {
  formatPriority,
  formatStatus,
  STATUS_OPTIONS,
  type StatusFilterValue,
} from './appointment.labels';

interface AppointmentFilters {
  readonly from?: string;
  readonly to?: string;
  readonly status?: StatusFilterValue;
  readonly search?: string;
}

/**
 * The workshop diary.
 *
 * WHY THE MONTH IS THE DEFAULT WINDOW
 * -----------------------------------
 * OfficeGest *requires* a date range — a request without one is refused — so
 * this screen never has the option of "everything". The month is the unit the
 * workshop actually works in, it is what someone opening the page is looking
 * for, and it keeps the window small enough that the backend can sort and
 * filter the whole of it (see `appointments.service.ts`). It is computed from
 * the clock on every reset, so it stays correct in January without anyone
 * touching this file.
 *
 * WHY THE FILTERS GO TO THE BACKEND
 * ---------------------------------
 * Filtering the ten rows already on screen would look right on page 1 and be
 * wrong everywhere else — the same reason `service-orders.ts` gives. The
 * backend holds the whole month, so it filters and sorts there and returns a
 * page of the *filtered* set, with an exact total.
 *
 * Race conditions are the store's job: every query change goes through one
 * `switchMap`, so a slow response for a term the user has already changed is
 * unsubscribed rather than rendered. The debounce is the search box's job. Both
 * are written once, elsewhere, which is why neither appears here.
 */
@Component({
  selector: 'app-appointments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, LastUpdated, ResourcePage],
  template: `
    <app-resource-page
      title="Marcações"
      subtitle="Agenda da oficina no OfficeGest."
      caption="Lista de marcações"
      countNoun="marcações"
      searchLabel="Pesquisar marcações"
      searchPlaceholder="Matrícula, assunto ou local…"
      [searchValue]="store.filters().search ?? ''"
      (search)="store.setFilters({ search: $event || undefined })"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
    >
      <div slot="actions" class="flex items-center gap-3">
        <app-last-updated [since]="lastUpdated()" />

        <!--
          Disabled while a request is in flight, which is what makes it safe to
          press repeatedly: the store would cancel and restart cleanly, but a
          button that visibly does nothing on the second press is the clearer
          contract.
        -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-body font-semibold text-ink-900 shadow-btn ring-1 ring-ink-950/8 transition-colors ring-inset hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="isBusy()"
          (click)="store.reload()"
        >
          <app-icon name="refresh" [class.animate-spin]="isBusy()" />
          Atualizar
        </button>
      </div>

      <div slot="filters" class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span>De</span>
          <input
            type="date"
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="dateValue(store.filters().from)"
            (ngModelChange)="store.setFilters({ from: toStartOfDay($event) })"
          />
        </label>

        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span>Até</span>
          <input
            type="date"
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="dateValue(store.filters().to)"
            (ngModelChange)="store.setFilters({ to: toEndOfDay($event) })"
          />
        </label>

        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span class="sr-only">Filtrar por estado</span>
          <select
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().status ?? ''"
            (ngModelChange)="store.setFilters({ status: $event || undefined })"
          >
            <option value="">Todos os estados</option>
            @for (option of statusOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </label>

        <!--
          Restores the default rather than clearing to nothing: an empty range
          is not a valid state for this screen, since upstream demands one.
        -->
        @if (isNarrowed()) {
          <button
            type="button"
            class="rounded-full px-3 py-2 text-meta font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            (click)="resetFilters()"
          >
            Repor o mês atual
          </button>
        }
      </div>
    </app-resource-page>
  `,
})
export class Appointments {
  private readonly officegest = inject(OfficeGestService);

  protected readonly statusOptions = STATUS_OPTIONS;

  /**
   * Staff names, so a booking shows who it is assigned to rather than an id.
   *
   * Resolves to an empty map when the roster cannot be read — a `USER` account
   * has no `workers.read` — so the column simply stays blank instead of taking
   * the page down with a 403. See `OfficeGestService.employeeNames`.
   */
  private readonly employeeNames = toSignal(this.officegest.employeeNames(), {
    initialValue: new Map<string, string>() as ReadonlyMap<string, string>,
  });

  /** Set from the response, which is what the freshness indicator reads. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceList<Appointment, AppointmentFilters>({
    fetch: (query) =>
      this.officegest.listAppointments(query).pipe(
        // `tap` on the success path only: a failed request has not refreshed
        // anything, and moving the timestamp would claim data that never
        // arrived. The indicator keeps showing the age of what is on screen.
        tap(() => this.fetchedAt.set(new Date())),
      ),
    initialFilters: currentMonth(),
    // The range is always set, so the default "any filter has a value" rule
    // would call every list filtered and offer to clear filters that cannot be
    // cleared. Only the two optional filters narrow anything.
    hasActiveFilters: (filters) => filters.status !== undefined || filters.search !== undefined,
  });

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  protected readonly isBusy = computed(
    () => this.store.status() === 'loading' || this.store.isRefreshing(),
  );

  /** Whether anything beyond the default month is applied. */
  protected readonly isNarrowed = computed(() => {
    const filters = this.store.filters();

    return filters.status !== undefined || filters.search !== undefined || !isCurrentMonth(filters);
  });

  protected readonly rowKey = (appointment: Appointment): string => appointment.id;
  protected readonly rowLink = (appointment: Appointment): string =>
    PRIVATE_ROUTES.appointment(appointment.id);
  protected readonly rowLabel = (appointment: Appointment): string =>
    `Ver marcação ${appointment.title ?? appointment.id}`;

  protected readonly columns: readonly TableColumn<Appointment>[] = [
    {
      key: 'title',
      header: 'Assunto',
      value: (appointment) => orNull(appointment.title),
      sortValue: (appointment) => appointment.title ?? null,
      priority: 'primary',
    },
    {
      key: 'startsAt',
      header: 'Início',
      value: (appointment) => formatDateTime(appointment.startsAt),
      sortValue: (appointment) => appointment.startsAt ?? null,
      priority: 'secondary',
    },
    {
      key: 'endsAt',
      header: 'Fim',
      value: (appointment) => formatDateTime(appointment.endsAt),
      sortValue: (appointment) => appointment.endsAt ?? null,
      priority: 'detail',
    },
    {
      key: 'plate',
      header: 'Matrícula',
      value: (appointment) => formatPlate(appointment.plate),
      sortValue: (appointment) => appointment.plate ?? null,
      priority: 'secondary',
    },
    {
      key: 'employee',
      header: 'Responsável',
      // Reading a signal in a column function is safe: `value` is called during
      // rendering, inside the template's reactive context.
      value: (appointment) => this.employeeName(appointment),
      sortValue: (appointment) => this.employeeName(appointment),
      priority: 'detail',
    },
    {
      key: 'location',
      header: 'Local',
      value: (appointment) => orNull(appointment.location),
      sortValue: (appointment) => appointment.location ?? null,
      priority: 'detail',
    },
    {
      key: 'priority',
      header: 'Prioridade',
      value: (appointment) => formatPriority(appointment.priority),
      sortValue: (appointment) => appointment.priority ?? null,
      priority: 'hidden',
    },
    {
      key: 'status',
      header: 'Estado',
      value: (appointment) => formatStatus(appointment.status),
      sortValue: (appointment) => appointment.status ?? null,
      badge: true,
      align: 'end',
    },
  ];

  protected resetFilters(): void {
    this.store.setFilters({ ...currentMonth(), status: undefined, search: undefined });
  }

  /** ISO instant → the `yyyy-MM-dd` an `<input type="date">` expects. */
  protected dateValue(iso: string | undefined): string {
    return iso ? (iso.slice(0, 10) ?? '') : '';
  }

  /**
   * A date input gives a day; the backend wants an instant. The day is widened
   * to its full local span so "de 1 até 1 de setembro" includes that whole day
   * rather than only midnight.
   */
  protected toStartOfDay(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  protected toEndOfDay(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private employeeName(appointment: Appointment): string | null {
    const id = appointment.employeeId;
    return id ? (this.employeeNames().get(id) ?? null) : null;
  }
}
