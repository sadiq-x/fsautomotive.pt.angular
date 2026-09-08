import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { LastUpdated } from '../../components/last-updated/last-updated';
import type { ServiceOrder } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPlate,
  orNull,
} from '../../utils/format';
import { formatMileageReading, formatServiceOrderStatus } from './service-order.labels';

/**
 * One work order.
 *
 * WHY THE FIELD LIST IS BUILT RATHER THAN WRITTEN OUT
 * ---------------------------------------------------
 * The record carries far more than this page used to show — the customer's
 * name, the mechanic, the mileage, the promised delivery date, whether it is
 * waiting for parts — and it carries different subsets on different jobs. A
 * fixed list would either omit the useful fields (which it did) or print a
 * dash for each absent one, which reads as a broken page rather than an empty
 * value. So each field is added only when it has something to say.
 *
 * The billed lines get a table of their own: they are the answer to "what was
 * actually done", they have their own columns, and squeezing them into a
 * label/value list would lose the arithmetic.
 */
@Component({
  selector: 'app-service-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage, LastUpdated, RouterLink],
  template: `
    <app-detail-page
      [status]="store.status()"
      [title]="title()"
      [subtitle]="subtitle()"
      [backLink]="routes.serviceOrders"
      backLabel="Folhas de obra"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Esta folha de obra não existe no OfficeGest ou foi removida."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="text-h3 text-ink-900">Dados da intervenção</h2>
          <app-last-updated [since]="lastUpdated()" />
        </div>

        @if (flags().length > 0) {
          <!--
            The two facts that change what someone does next, so they sit above
            the field list rather than eleventh in it.
          -->
          <ul class="mt-4 flex flex-wrap gap-2">
            @for (flag of flags(); track flag.label) {
              <li
                class="rounded-full px-3 py-1 text-meta font-semibold ring-1 ring-inset"
                [class]="flag.class"
              >
                {{ flag.label }}
              </li>
            }
          </ul>
        }

        <app-detail-list class="mt-5" [fields]="fields()" />

        @if (plateLink(); as plate) {
          <p class="mt-6 border-t border-ink-950/6 pt-5">
            <a
              class="rounded-sm font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              [routerLink]="routes.vehicle(plate)"
            >
              Ver a viatura {{ formatPlate(plate) }}
            </a>
          </p>
        }
      </section>

      @if (lines().length > 0) {
        <section class="mt-6 rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
          <h2 class="text-h3 text-ink-900">Peças e mão de obra</h2>

          <div class="mt-5 overflow-x-auto">
            <table class="w-full min-w-xl border-collapse text-body">
              <caption class="sr-only">
                Linhas faturadas nesta folha de obra
              </caption>
              <thead>
                <tr class="border-b border-ink-950/8 text-meta text-ink-500">
                  <th scope="col" class="py-2 text-left font-semibold">Descrição</th>
                  <th scope="col" class="py-2 text-right font-semibold">Qt.</th>
                  <th scope="col" class="py-2 text-right font-semibold">Preço</th>
                  <th scope="col" class="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (line of lines(); track line.key) {
                  <tr class="border-b border-ink-950/6 last:border-0">
                    <td class="py-2 pr-4 text-ink-900">{{ line.description }}</td>
                    <td class="py-2 text-right text-ink-700 tabular-nums">{{ line.quantity }}</td>
                    <td class="py-2 text-right text-ink-700 tabular-nums">{{ line.unitPrice }}</td>
                    <td class="py-2 text-right font-semibold text-ink-900 tabular-nums">
                      {{ line.total }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </app-detail-page>
  `,
})
export class ServiceOrderDetail {
  /** Bound from the `:serviceOrderId` route parameter. */
  readonly serviceOrderId = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;
  protected readonly formatPlate = formatPlate;

  /** Set from the response, so it is the moment the data actually arrived. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceDetail({
    id: this.serviceOrderId,
    fetch: (id) =>
      this.officegest.getServiceOrder(id).pipe(tap(() => this.fetchedAt.set(new Date()))),
  });

  /** Empty when the roster is not readable; the field is then simply omitted. */
  private readonly employeeNames = toSignal(this.officegest.employeeNames(), {
    initialValue: new Map<string, string>() as ReadonlyMap<string, string>,
  });

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  protected readonly title = computed(() => {
    const order = this.store.data();
    return order ? `Folha de obra ${order.number ?? order.id}` : '';
  });

  protected readonly subtitle = computed(() => {
    const order = this.store.data();

    if (!order) {
      return null;
    }

    // The two things that identify the job at a glance, when both are known.
    return [order.customerName, formatPlate(order.plate)].filter(Boolean).join(' · ') || null;
  });

  protected readonly plateLink = computed(() => this.store.data()?.plate ?? null);

  /** Conditions that change what someone does with the car. */
  protected readonly flags = computed<readonly { label: string; class: string }[]>(() => {
    const order = this.store.data();

    if (!order) {
      return [];
    }

    const flags: { label: string; class: string }[] = [];

    if (order.cancelled) {
      flags.push({ label: 'Anulada', class: 'bg-red-50 text-red-700 ring-red-600/20' });
    }

    if (order.awaitingParts) {
      flags.push({
        label: 'A aguardar peças',
        class: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      });
    }

    return flags;
  });

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const order = this.store.data();

    if (!order) {
      return [];
    }

    // Declared in reading order, then filtered — so the order is obvious here
    // and "omit what is absent" is applied once, at the end.
    const candidates: readonly (DetailField & { readonly value: string | null })[] = [
      { label: 'Número', value: orNull(order.number ?? order.id) },
      {
        label: 'Estado',
        value: formatServiceOrderStatus(order.status, order.statusName),
        badge: true,
      },
      { label: 'Cliente', value: orNull(order.customerName) },
      { label: 'Matrícula', value: formatPlate(order.plate) },
      { label: 'Quilómetros', value: formatMileageReading(order.mileage) },
      { label: 'Mecânico', value: this.mechanicName(order) },
      { label: 'Abertura', value: formatDate(order.openedAt) },
      { label: 'Entrada no sistema', value: formatDateTime(order.registeredAt) },
      { label: 'Entrega prevista', value: formatDate(order.expectedDeliveryAt) },
      { label: 'Fecho', value: formatDate(order.closedAt) },
      { label: 'Total', value: formatCurrency(order.total) },
      { label: 'Descrição', value: orNull(order.description), wide: true },
      { label: 'Notas do mecânico', value: orNull(order.mechanicNotes), wide: true },
    ];

    return candidates.filter((field) => field.value !== null);
  });

  /** The billed lines, pre-formatted so the template does no arithmetic. */
  protected readonly lines = computed(() =>
    (this.store.data()?.lines ?? []).map((line, index) => ({
      // The upstream id is not guaranteed unique across `lines` and
      // `extra_lines`, which the backend concatenates — so the index is what
      // makes the `track` expression safe.
      key: `${line.id ?? 'line'}-${index}`,
      description: orNull(line.description) ?? '—',
      quantity: line.quantity?.toLocaleString('pt-PT') ?? '—',
      unitPrice: formatCurrency(line.unitPrice) ?? '—',
      total: formatCurrency(line.total) ?? '—',
    })),
  );

  private mechanicName(order: ServiceOrder): string | null {
    const id = order.mechanicId;

    if (!id) {
      return null;
    }

    // The id is a poor label, but dropping the fact that the job is assigned
    // would be worse than showing it when the roster could not be read.
    return this.employeeNames().get(id) ?? `#${id}`;
  }
}
