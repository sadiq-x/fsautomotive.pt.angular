import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { LastUpdated } from '../../components/last-updated/last-updated';
import type { ServiceOrder } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import {
  formatActive,
  formatDate,
  formatDateTime,
  formatMileage,
  formatPlate,
  orNull,
} from '../../utils/format';
import { formatServiceOrderStatus } from '../service-orders/service-order.labels';
import { describeVehicle, formatMonthlyMileage } from './vehicle.labels';

/** Enough to see the car's recent history without turning this into a list page. */
const HISTORY_SIZE = 5;

/**
 * One vehicle, with its recent work.
 *
 * WHY THIS PAGE SHOWED ALMOST NOTHING
 * -----------------------------------
 * Two separate causes, both now fixed upstream of this file.
 *
 * It did not load at all: the backend addressed the vehicle by its normalised
 * plate and OfficeGest keys them hyphenated, so every car reported "não
 * encontrado" (see `vehicles.service.ts`).
 *
 * And when it did load it had little to show, because the record's most useful
 * fields — the fuel, the colour, the chassis number, the owner, the next
 * inspection — were either never read or arrive as bare numeric ids that the
 * backend now resolves into names.
 *
 * WHY THE WORK HISTORY IS FETCHED HERE
 * ------------------------------------
 * "Last intervention" is not a field on a vehicle; it does not exist upstream
 * in any form. It is a fact about that plate's work orders, and the backend
 * already filters those by plate and returns them newest first — so the honest
 * way to answer "when was this car last in" is to ask that question, which
 * costs one request and also gives the reader the jobs themselves.
 *
 * It fails quietly: work orders sit behind their own permission, and a vehicle
 * page that renders without a history is useful, while one that shows an error
 * because a *supplementary* list failed is not.
 */
@Component({
  selector: 'app-vehicle-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage, LastUpdated, RouterLink],
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
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="text-h3 text-ink-900">Dados do veículo</h2>
          <app-last-updated [since]="lastUpdated()" />
        </div>

        <app-detail-list class="mt-5" [fields]="fields()" />

        @if (links().length > 0) {
          <p class="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-950/6 pt-5">
            @for (link of links(); track link.route) {
              <a
                class="rounded-sm font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                [routerLink]="link.route"
                >{{ link.label }}</a
              >
            }
          </p>
        }
      </section>

      @if (history().length > 0) {
        <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
          <h2 class="text-h3 text-ink-900">Intervenções recentes</h2>

          <ul class="mt-5 divide-y divide-ink-950/6">
            @for (order of history(); track order.id) {
              <li class="py-3 first:pt-0 last:pb-0">
                <a
                  class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  [routerLink]="routes.serviceOrder(order.id)"
                >
                  <span class="font-semibold text-brand-700">{{ order.label }}</span>
                  <span class="text-meta text-ink-500">{{ order.openedAt }}</span>
                  @if (order.description) {
                    <span class="w-full text-body text-ink-700">{{ order.description }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </section>
      }
    </app-detail-page>
  `,
})
export class VehicleDetail {
  /** Bound from the `:plate` route parameter. */
  readonly plate = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;

  /** Set from the response, so it is the moment the data actually arrived. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceDetail({
    id: this.plate,
    fetch: (plate) =>
      this.officegest.getVehicle(plate).pipe(tap(() => this.fetchedAt.set(new Date()))),
  });

  /** That plate's work orders, newest first. Empty when they cannot be read. */
  private readonly serviceOrders = toSignal(
    toObservable(this.plate).pipe(
      switchMap((plate) =>
        this.officegest.listServiceOrders({ page: 1, perPage: HISTORY_SIZE, plate }).pipe(
          map((paged) => paged.items),
          // Inside the projection, so a failure ends this request and not the
          // stream — navigating to the next vehicle must still fetch.
          catchError(() => of<readonly ServiceOrder[]>([])),
        ),
      ),
    ),
    { initialValue: [] as readonly ServiceOrder[] },
  );

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  protected readonly formattedPlate = computed(
    () => formatPlate(this.store.data()?.plate ?? this.plate()) ?? '',
  );

  protected readonly subtitle = computed(() => {
    const vehicle = this.store.data();

    return vehicle ? describeVehicle(vehicle) : null;
  });

  /** The most recent job's date, which is what "last intervention" means here. */
  private readonly lastServiceAt = computed(() => this.serviceOrders().at(0)?.openedAt);

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const vehicle = this.store.data();

    if (!vehicle) {
      return [];
    }

    // Declared in reading order, then filtered — so the order is obvious here
    // and "omit what is absent" is applied once, at the end. A record carries
    // different subsets on different cars, and a fixed list would print a dash
    // for each missing one, which reads as a broken page rather than an empty
    // value.
    const candidates: readonly (DetailField & { readonly value: string | null })[] = [
      { label: 'Matrícula', value: formatPlate(vehicle.plate) },
      { label: 'Estado', value: formatActive(vehicle.active), badge: true },
      { label: 'Marca', value: orNull(vehicle.brand) },
      { label: 'Modelo', value: orNull(vehicle.model) },
      { label: 'Versão', value: orNull(vehicle.version) },
      { label: 'Combustível', value: orNull(vehicle.fuel) },
      { label: 'Cor', value: orNull(vehicle.color) },
      { label: 'Quilómetros', value: formatMileage(vehicle.mileage) },
      { label: 'Média mensal', value: formatMonthlyMileage(vehicle.monthlyMileage) },
      { label: 'Chassis (VIN)', value: orNull(vehicle.vin) },
      { label: 'Próxima inspeção', value: formatDate(vehicle.nextInspectionAt) },
      { label: 'Proprietário', value: orNull(vehicle.ownerName) },
      { label: 'Última intervenção', value: formatDate(this.lastServiceAt()) },
      { label: 'Registada em', value: formatDate(vehicle.registeredAt) },
      { label: 'Última atualização', value: formatDateTime(vehicle.updatedAt) },
      { label: 'Descrição', value: orNull(vehicle.description), wide: true },
    ];

    return candidates.filter((field) => field.value !== null);
  });

  /** Where this car leads: its owner, and whoever is invoiced for it. */
  protected readonly links = computed<readonly { label: string; route: string }[]>(() => {
    const vehicle = this.store.data();

    if (!vehicle) {
      return [];
    }

    const links: { label: string; route: string }[] = [];

    if (vehicle.customerId) {
      links.push({
        label: vehicle.ownerName ? `Ver o cliente ${vehicle.ownerName}` : 'Ver o proprietário',
        route: this.routes.customer(vehicle.customerId),
      });
    }

    // Only when it is someone else — on most cars it repeats the owner, and a
    // second link to the same person is noise.
    if (vehicle.billingCustomerId && vehicle.billingCustomerId !== vehicle.customerId) {
      links.push({
        label: 'Ver o cliente de faturação',
        route: this.routes.customer(vehicle.billingCustomerId),
      });
    }

    return links;
  });

  /** Pre-formatted, so the template does no work. */
  protected readonly history = computed(() =>
    this.serviceOrders().map((order) => ({
      id: order.id,
      label: [order.number ?? order.id, formatServiceOrderStatus(order.status, order.statusName)]
        .filter(Boolean)
        .join(' · '),
      openedAt: formatDate(order.openedAt) ?? '',
      description: orNull(order.description),
    })),
  );
}
