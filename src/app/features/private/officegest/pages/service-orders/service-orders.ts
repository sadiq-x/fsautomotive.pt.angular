import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { ServiceOrder } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { formatCurrency, formatDate, formatPlate, orNull } from '../../utils/format';

interface ServiceOrderFilters {
  readonly plate?: string;
  readonly status?: string;
}

/**
 * Work orders, filtered server-side.
 *
 * The plate and status filters are sent to the backend rather than applied to
 * the loaded page: filtering in the browser would only ever narrow the 25 rows
 * already fetched, which looks correct on page 1 and is wrong everywhere else.
 *
 * There is no search box because the backend exposes no `search` parameter for
 * this resource — offering one that quietly did nothing would be worse than
 * its absence.
 */
@Component({
  selector: 'app-service-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ResourcePage],
  template: `
    <app-resource-page
      title="Folhas de obra"
      subtitle="Intervenções registadas no OfficeGest."
      caption="Lista de folhas de obra"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
    >
      <div slot="filters" class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2">
          <span class="sr-only">Filtrar por matrícula</span>
          <input
            type="text"
            inputmode="text"
            maxlength="16"
            placeholder="Matrícula (AA-00-BB)"
            class="w-48 rounded-full border-0 bg-white px-4 py-2.5 text-body text-ink-900 uppercase shadow-btn ring-1 ring-ink-950/8 ring-inset placeholder:text-ink-400 placeholder:normal-case focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().plate ?? ''"
            (ngModelChange)="onPlate($event)"
          />
        </label>

        <label class="flex items-center gap-2">
          <span class="sr-only">Filtrar por estado</span>
          <input
            type="text"
            maxlength="40"
            placeholder="Estado"
            class="w-40 rounded-full border-0 bg-white px-4 py-2.5 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().status ?? ''"
            (ngModelChange)="store.setFilters({ status: $event || undefined })"
          />
        </label>
      </div>
    </app-resource-page>
  `,
})
export class ServiceOrders {
  private readonly officegest = inject(OfficeGestService);

  protected readonly store = createResourceList<ServiceOrder, ServiceOrderFilters>({
    fetch: (query) => this.officegest.listServiceOrders(query),
    initialFilters: {},
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
      key: 'plate',
      header: 'Matrícula',
      value: (order) => formatPlate(order.plate),
      sortValue: (order) => order.plate ?? null,
      priority: 'secondary',
    },
    {
      key: 'description',
      header: 'Descrição',
      value: (order) => orNull(order.description),
      priority: 'hidden',
    },
    {
      key: 'openedAt',
      header: 'Abertura',
      value: (order) => formatDate(order.openedAt),
      sortValue: (order) => order.openedAt ?? null,
    },
    {
      key: 'status',
      header: 'Estado',
      value: (order) => orNull(order.status),
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

  /**
   * The backend normalises the plate itself, but sending a partial one would
   * return nothing — so the filter is only applied once it is plausibly whole.
   */
  protected onPlate(raw: string): void {
    const normalised = raw.toUpperCase().replace(/[\s._-]/g, '');
    this.store.setFilters({
      plate: normalised.length === 6 ? normalised : undefined,
    });
  }
}
