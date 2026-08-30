import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import { formatActive, orNull } from '../../utils/format';

/**
 * One customer.
 *
 * `customerId` arrives as a signal input from the route, via
 * `withComponentInputBinding()` — already configured for the public site. That
 * is what lets the store refetch when the id changes without a manual
 * subscription to `paramMap`.
 */
@Component({
  selector: 'app-customer-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage],
  template: `
    <app-detail-page
      [status]="store.status()"
      [title]="store.data()?.name ?? ''"
      [subtitle]="subtitle()"
      [backLink]="routes.customers"
      backLabel="Clientes"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Este cliente não existe no OfficeGest ou foi removido."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <h2 class="text-h3 text-ink-900">Dados do cliente</h2>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `,
})
export class CustomerDetail {
  /** Bound from the `:customerId` route parameter. */
  readonly customerId = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;

  protected readonly store = createResourceDetail({
    id: this.customerId,
    fetch: (id) => this.officegest.getCustomer(id),
  });

  protected readonly subtitle = computed(() => {
    const customer = this.store.data();
    return customer ? `Cliente #${customer.id}` : null;
  });

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const customer = this.store.data();

    if (!customer) {
      return [];
    }

    return [
      { label: 'Nome', value: orNull(customer.name) },
      { label: 'NIF', value: orNull(customer.taxId) },
      {
        label: 'E-mail',
        value: orNull(customer.email),
        href: customer.email ? `mailto:${customer.email}` : undefined,
      },
      {
        label: 'Telefone',
        value: orNull(customer.phone),
        href: customer.phone ? `tel:${customer.phone}` : undefined,
      },
      {
        label: 'Telemóvel',
        value: orNull(customer.mobile),
        href: customer.mobile ? `tel:${customer.mobile}` : undefined,
      },
      { label: 'Localidade', value: orNull(customer.city) },
      { label: 'Código postal', value: orNull(customer.postalCode) },
      { label: 'País', value: orNull(customer.country) },
      { label: 'Estado', value: formatActive(customer.active), badge: true },
    ];
  });
}
