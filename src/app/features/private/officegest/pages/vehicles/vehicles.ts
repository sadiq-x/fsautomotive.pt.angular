import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { Icon } from '../../../../../shared/components/icon/icon';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { Vehicle } from '../../models';
import type { VehicleStatus } from '../../models/officegest.requests';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { formatActive, formatDate, formatMileage, formatPlate, orNull } from '../../utils/format';
import { VEHICLE_STATUS_OPTIONS, describeVehicle } from './vehicle.labels';

interface VehicleFilters {
  readonly search?: string;
  readonly status?: VehicleStatus;
}

/**
 * The vehicle list. A vehicle is addressed by its plate, as the backend does.
 *
 * WHY THERE IS NO DATE WINDOW HERE
 * --------------------------------
 * The bookings and work-order lists default to the current month because both
 * are records of something that happened on a date. A vehicle is not: the only
 * date it carries is when the workshop first registered it, and defaulting to
 * "cars added this month" would hide the entire fleet behind a filter nobody
 * asked for. So the list is unfiltered, and ordering carries the "most recent
 * first" requirement instead — the backend sorts by that registration date,
 * which is why the column is shown.
 *
 * WHY THERE IS NO YEAR OR LAST-SERVICE COLUMN
 * -------------------------------------------
 * There were, and both were empty on every row. Neither field exists upstream:
 * confirmed across all 2 613 vehicles on the tenant and on sampled detail
 * records, under every candidate name the mapper tried. A column that can only
 * ever render a dash is worse than no column, so they are gone — the date of
 * the last intervention now appears on the vehicle's own page, where it can be
 * read from that plate's work orders.
 */
@Component({
  selector: 'app-vehicles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, LastUpdated, ResourcePage],
  template: `
    <app-resource-page
      title="Veículos"
      countNoun="viaturas"
      subtitle="Viaturas registadas na oficina, das mais recentes para as mais antigas."
      caption="Lista de veículos"
      searchLabel="Pesquisar veículos"
      searchPlaceholder="Matrícula completa, VIN ou descrição"
      [searchValue]="store.filters().search ?? ''"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
      (search)="store.setFilters({ search: $event || undefined })"
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
          <span class="sr-only">Filtrar por estado</span>
          <select
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="store.filters().status ?? ''"
            (ngModelChange)="onStatus($event)"
          >
            @for (option of statusOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </label>
      </div>
    </app-resource-page>
  `,
})
export class Vehicles {
  private readonly officegest = inject(OfficeGestService);

  protected readonly statusOptions = VEHICLE_STATUS_OPTIONS;

  /** Set from the response, which is what the freshness indicator reads. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceList<Vehicle, VehicleFilters>({
    fetch: (query) =>
      this.officegest.listVehicles(query).pipe(
        // Only on success: a failed request refreshed nothing, and moving the
        // timestamp would claim data that never arrived.
        tap(() => this.fetchedAt.set(new Date())),
      ),
    count: (filters) => this.officegest.countVehicles(filters),
    initialFilters: {},
  });

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  protected readonly isBusy = computed(
    () => this.store.status() === 'loading' || this.store.isRefreshing(),
  );

  protected readonly rowKey = (vehicle: Vehicle): string => vehicle.plate;
  protected readonly rowLink = (vehicle: Vehicle): string => PRIVATE_ROUTES.vehicle(vehicle.plate);
  protected readonly rowLabel = (vehicle: Vehicle): string =>
    `Ver veículo ${formatPlate(vehicle.plate)}`;

  protected readonly columns: readonly TableColumn<Vehicle>[] = [
    {
      key: 'plate',
      header: 'Matrícula',
      value: (vehicle) => formatPlate(vehicle.plate),
      sortValue: (vehicle) => vehicle.plate,
      priority: 'primary',
    },
    {
      key: 'vehicle',
      header: 'Marca e modelo',
      // The brand is resolved for every row; the model name reaches us only on
      // a detail record, so the tenant's own description fills the gap rather
      // than leaving half a cell.
      value: (vehicle) => describeVehicle(vehicle),
      sortValue: (vehicle) => vehicle.brand ?? vehicle.description ?? null,
      priority: 'secondary',
    },
    { key: 'fuel', header: 'Combustível', value: (vehicle) => orNull(vehicle.fuel) },
    {
      key: 'mileage',
      header: 'Quilómetros',
      value: (vehicle) => formatMileage(vehicle.mileage),
      sortValue: (vehicle) => vehicle.mileage ?? null,
      align: 'end',
      numeric: true,
    },
    {
      key: 'nextInspectionAt',
      header: 'Próxima inspeção',
      value: (vehicle) => formatDate(vehicle.nextInspectionAt),
      sortValue: (vehicle) => vehicle.nextInspectionAt ?? null,
      align: 'end',
      priority: 'detail',
    },
    {
      key: 'registeredAt',
      header: 'Registada em',
      value: (vehicle) => formatDate(vehicle.registeredAt),
      sortValue: (vehicle) => vehicle.registeredAt ?? null,
      align: 'end',
      priority: 'detail',
    },
    {
      key: 'active',
      header: 'Estado',
      value: (vehicle) => formatActive(vehicle.active),
      sortValue: (vehicle) => (vehicle.active === undefined ? null : String(vehicle.active)),
      badge: true,
    },
  ];

  /** `''` is the "all states" option, which means removing the filter. */
  protected onStatus(value: string): void {
    this.store.setFilters({ status: (value || undefined) as VehicleStatus | undefined });
  }
}
