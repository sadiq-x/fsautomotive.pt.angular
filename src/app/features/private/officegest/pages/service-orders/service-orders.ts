import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { Icon } from '../../../../../shared/components/icon/icon';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { ServiceOrder } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { currentMonth, isCurrentMonth } from '../../utils/date-range';
import { formatCurrency, formatDate, formatPlate, orNull } from '../../utils/format';
import {
  formatMileageReading,
  formatServiceOrderStatus,
  SERVICE_ORDER_STATUS_OPTIONS,
} from './service-order.labels';

interface ServiceOrderFilters {
  readonly plate?: string;
  readonly status?: string;
  readonly from?: string;
  readonly to?: string;
  readonly search?: string;
}

/**
 * Work orders.
 *
 * WHY THIS PAGE LOOKS LIKE THE BOOKINGS PAGE
 * ------------------------------------------
 * Because it is the same problem. Both list a dated resource the workshop reads
 * a month at a time, and both need the same five things: a default window, a
 * status filter, a debounced search, a reload, and a way to see how stale the
 * data is. Everything that could be shared is: `ResourcePage` supplies the
 * search box and the states, `createResourceList` the cancellation, `LastUpdated`
 * the freshness dot, and `currentMonth` the window. What is left here is what is
 * genuinely particular to work orders — the columns and the status vocabulary.
 *
 * WHY THE FILTERS AND THE SORT ARE THE BACKEND'S JOB
 * --------------------------------------------------
 * `/workshop/service-orders` ignores `page` outright and pages by cursor, so the
 * backend gathers the month and does the ordering, searching and paging itself
 * (see `service-orders.service.ts`). Doing any of it here would only ever sort
 * or search the ten rows already fetched.
 */
@Component({
  selector: 'app-service-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, LastUpdated, ResourcePage],
  template: `
    <app-resource-page
      title="Folhas de obra"
      subtitle="Intervenções registadas no OfficeGest."
      caption="Lista de folhas de obra"
      countNoun="folhas de obra"
      searchLabel="Pesquisar folhas de obra"
      searchPlaceholder="Nº, matrícula, cliente ou descrição…"
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

        <label class="flex items-center gap-2">
          <span class="sr-only">Filtrar por matrícula</span>
          <input
            type="text"
            inputmode="text"
            maxlength="16"
            placeholder="Matrícula (AA-00-BB)"
            class="w-44 rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 uppercase shadow-btn ring-1 ring-ink-950/8 ring-inset placeholder:text-ink-400 placeholder:normal-case focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().plate ?? ''"
            (ngModelChange)="onPlate($event)"
          />
        </label>

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
export class ServiceOrders {
  private readonly officegest = inject(OfficeGestService);

  protected readonly statusOptions = SERVICE_ORDER_STATUS_OPTIONS;

  /** Set from the response, which is what the freshness indicator reads. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceList<ServiceOrder, ServiceOrderFilters>({
    fetch: (query) =>
      this.officegest.listServiceOrders(query).pipe(
        // Only on success: a failed request refreshed nothing, and moving the
        // timestamp would claim data that never arrived.
        tap(() => this.fetchedAt.set(new Date())),
      ),
    initialFilters: currentMonth(),
    // The window is always set, so the default "any filter has a value" rule
    // would call every list filtered and offer to clear a range the screen
    // cannot work without.
    hasActiveFilters: (filters) =>
      filters.status !== undefined || filters.search !== undefined || filters.plate !== undefined,
  });

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  protected readonly isBusy = computed(
    () => this.store.status() === 'loading' || this.store.isRefreshing(),
  );

  protected readonly isNarrowed = computed(() => {
    const filters = this.store.filters();

    return (
      filters.status !== undefined ||
      filters.search !== undefined ||
      filters.plate !== undefined ||
      !isCurrentMonth(filters)
    );
  });

  protected readonly rowKey = (order: ServiceOrder): string => order.id;
  protected readonly rowLink = (order: ServiceOrder): string =>
    PRIVATE_ROUTES.serviceOrder(order.id);
  protected readonly rowLabel = (order: ServiceOrder): string =>
    `Ver folha de obra ${order.number ?? order.id}`;

  protected readonly columns: readonly TableColumn<ServiceOrder>[] = [
    {
      key: 'number',
      header: 'Nº',
      value: (order) => orNull(order.number ?? order.id),
      sortValue: (order) => order.number ?? order.id,
      priority: 'primary',
    },
    {
      key: 'customerName',
      header: 'Cliente',
      value: (order) => orNull(order.customerName),
      sortValue: (order) => order.customerName ?? null,
      priority: 'secondary',
    },
    {
      key: 'plate',
      header: 'Matrícula',
      value: (order) => formatPlate(order.plate),
      sortValue: (order) => order.plate ?? null,
      priority: 'secondary',
    },
    {
      key: 'openedAt',
      header: 'Abertura',
      value: (order) => formatDate(order.openedAt),
      sortValue: (order) => order.openedAt ?? null,
    },
    {
      key: 'mileage',
      header: 'Kms',
      value: (order) => formatMileageReading(order.mileage),
      sortValue: (order) => order.mileage ?? null,
      priority: 'detail',
      numeric: true,
      align: 'end',
    },
    {
      key: 'description',
      header: 'Descrição',
      value: (order) => orNull(order.description),
      priority: 'hidden',
    },
    {
      key: 'status',
      header: 'Estado',
      value: (order) => formatServiceOrderStatus(order.status, order.statusName),
      sortValue: (order) => order.status ?? null,
      badge: true,
    },
    {
      key: 'total',
      header: 'Total',
      value: (order) => formatCurrency(order.total),
      sortValue: (order) => order.total ?? null,
      align: 'end',
      numeric: true,
    },
  ];

  protected resetFilters(): void {
    this.store.setFilters({
      ...currentMonth(),
      status: undefined,
      search: undefined,
      plate: undefined,
    });
  }

  /**
   * The backend normalises the plate itself, but a partial one would filter the
   * list down to nothing — so it is only applied once it is plausibly whole.
   */
  protected onPlate(raw: string): void {
    const normalised = raw.toUpperCase().replace(/[\s._-]/g, '');

    this.store.setFilters({ plate: normalised.length === 6 ? normalised : undefined });
  }

  /** ISO instant → the `yyyy-MM-dd` an `<input type="date">` expects. */
  protected dateValue(iso: string | undefined): string {
    return iso ? (iso.slice(0, 10) ?? '') : '';
  }

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
}
