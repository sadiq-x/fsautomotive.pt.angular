import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import { formatDate, formatMileage, formatPlate, orNull } from '../../utils/format';

/**
 * One vehicle, with a shortcut to its work history.
 *
 * The link to the service orders passes the plate as a filter rather than
 * loading them here: the backend already supports `?plate=`, so the existing
 * list page does the job, paginated and searchable, with no new code.
 */
@Component({
  selector: 'app-vehicle-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage, RouterLink, UiButton],
  template: `
    <app-detail-page
      [status]="store.status()"
      [title]="formattedPlate()"
      [subtitle]="subtitle()"
      [backLink]="routes.vehicles"
      backLabel="Veículos"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Não existe nenhum veículo com esta matrícula no OfficeGest."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-h3 text-ink-900">Dados do veículo</h2>
          <app-button
            variant="secondary"
            size="sm"
            icon="clipboard-list"
            iconPosition="left"
            [routerLink]="routes.serviceOrders"
            >Folhas de obra</app-button
          >
        </div>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `,
})
export class VehicleDetail {
  /** Bound from the `:plate` route parameter. */
  readonly plate = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;

  protected readonly store = createResourceDetail({
    id: this.plate,
    fetch: (plate) => this.officegest.getVehicle(plate),
  });

  protected readonly formattedPlate = computed(
    () => formatPlate(this.store.data()?.plate ?? this.plate()) ?? '',
  );

  protected readonly subtitle = computed(() => {
    const vehicle = this.store.data();

    if (!vehicle) {
      return null;
    }

    return orNull([vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(' '));
  });

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const vehicle = this.store.data();

    if (!vehicle) {
      return [];
    }

    return [
      { label: 'Matrícula', value: formatPlate(vehicle.plate) },
      { label: 'Marca', value: orNull(vehicle.brand) },
      { label: 'Modelo', value: orNull(vehicle.model) },
      { label: 'Versão', value: orNull(vehicle.version) },
      { label: 'Ano', value: vehicle.year ? String(vehicle.year) : null },
      { label: 'Combustível', value: orNull(vehicle.fuel) },
      { label: 'Quilómetros', value: formatMileage(vehicle.mileage) },
      { label: 'Chassis (VIN)', value: orNull(vehicle.vin) },
      { label: 'Última intervenção', value: formatDate(vehicle.lastServiceAt) },
    ];
  });
}
