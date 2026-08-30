import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import { formatCurrency, formatDate, formatPlate, orNull } from '../../utils/format';

/** One work order. */
@Component({
  selector: 'app-service-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage],
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
        <h2 class="text-h3 text-ink-900">Dados da intervenção</h2>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `,
})
export class ServiceOrderDetail {
  /** Bound from the `:serviceOrderId` route parameter. */
  readonly serviceOrderId = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;

  protected readonly store = createResourceDetail({
    id: this.serviceOrderId,
    fetch: (id) => this.officegest.getServiceOrder(id),
  });

  protected readonly title = computed(() => {
    const order = this.store.data();
    return order ? `Folha de obra ${order.number ?? order.id}` : '';
  });

  protected readonly subtitle = computed(() => formatPlate(this.store.data()?.plate));

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const order = this.store.data();

    if (!order) {
      return [];
    }

    return [
      { label: 'Número', value: orNull(order.number ?? order.id) },
      { label: 'Matrícula', value: formatPlate(order.plate) },
      { label: 'Estado', value: orNull(order.status), badge: true },
      { label: 'Abertura', value: formatDate(order.openedAt) },
      { label: 'Fecho', value: formatDate(order.closedAt) },
      { label: 'Total', value: formatCurrency(order.total) },
      { label: 'Descrição', value: orNull(order.description), wide: true },
    ];
  });
}
