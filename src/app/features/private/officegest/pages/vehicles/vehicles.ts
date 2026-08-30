import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { Vehicle } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { formatDate, formatMileage, formatPlate, orNull } from '../../utils/format';

interface VehicleFilters {
  readonly search?: string;
}

/** The vehicle list. A vehicle is addressed by its plate, as the backend does. */
@Component({
  selector: 'app-vehicles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePage],
  template: `
    <app-resource-page
      title="Veículos"
      subtitle="Viaturas registadas na oficina."
      caption="Lista de veículos"
      searchLabel="Pesquisar veículos"
      searchPlaceholder="Matrícula, marca ou modelo…"
      [searchValue]="store.filters().search ?? ''"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
      (search)="store.setFilters({ search: $event || undefined })"
    />
  `,
})
export class Vehicles {
  private readonly officegest = inject(OfficeGestService);

  protected readonly store = createResourceList<Vehicle, VehicleFilters>({
    fetch: (query) => this.officegest.listVehicles(query),
    initialFilters: {},
  });

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
      value: (vehicle) => orNull([vehicle.brand, vehicle.model].filter(Boolean).join(' ')),
      sortValue: (vehicle) => vehicle.brand ?? null,
      priority: 'secondary',
    },
    {
      key: 'year',
      header: 'Ano',
      value: (vehicle) => (vehicle.year ? String(vehicle.year) : null),
      sortValue: (vehicle) => vehicle.year ?? null,
      numeric: true,
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
      key: 'lastServiceAt',
      header: 'Última intervenção',
      value: (vehicle) => formatDate(vehicle.lastServiceAt),
      sortValue: (vehicle) => vehicle.lastServiceAt ?? null,
      align: 'end',
    },
  ];
}
