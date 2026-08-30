import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { Customer } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { formatActive, orNull } from '../../utils/format';

/**
 * The customer list.
 *
 * This is what a resource page costs once the shells exist: a column
 * definition, a fetch, and where a row goes. Everything else — search
 * debouncing, cancellation of the superseded request, the loading/empty/error
 * states, pagination, the mobile card layout — comes from `ResourcePage` and
 * `createResourceList`, identically on every page.
 *
 * Adding the next OfficeGest resource is this file with different columns.
 */
interface CustomerFilters {
  readonly search?: string;
}

@Component({
  selector: 'app-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePage],
  template: `
    <app-resource-page
      title="Clientes"
      subtitle="Base de clientes sincronizada com o OfficeGest."
      caption="Lista de clientes"
      searchLabel="Pesquisar clientes"
      searchPlaceholder="Nome, NIF ou e-mail…"
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
export class Customers {
  private readonly officegest = inject(OfficeGestService);

  protected readonly store = createResourceList<Customer, CustomerFilters>({
    fetch: (query) => this.officegest.listCustomers(query),
    initialFilters: {},
  });

  protected readonly rowKey = (customer: Customer): string => customer.id;
  protected readonly rowLink = (customer: Customer): string => PRIVATE_ROUTES.customer(customer.id);
  protected readonly rowLabel = (customer: Customer): string => `Ver ${customer.name}`;

  protected readonly columns: readonly TableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Nome',
      value: (customer) => orNull(customer.name),
      sortValue: (customer) => customer.name,
      priority: 'primary',
    },
    {
      key: 'taxId',
      header: 'NIF',
      value: (customer) => orNull(customer.taxId),
      sortValue: (customer) => customer.taxId ?? null,
      priority: 'secondary',
    },
    {
      key: 'email',
      header: 'E-mail',
      value: (customer) => orNull(customer.email),
      sortValue: (customer) => customer.email ?? null,
    },
    {
      key: 'phone',
      header: 'Telefone',
      // Either number is the one the workshop would ring; showing whichever
      // exists beats an empty column and a second one nobody reads.
      value: (customer) => orNull(customer.mobile ?? customer.phone),
    },
    { key: 'city', header: 'Localidade', value: (customer) => orNull(customer.city) },
    {
      key: 'active',
      header: 'Estado',
      value: (customer) => formatActive(customer.active),
      badge: true,
      align: 'end',
    },
  ];
}
