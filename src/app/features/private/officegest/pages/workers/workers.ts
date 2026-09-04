import { ChangeDetectionStrategy, Component } from '@angular/core';

import type { TableColumn } from '../../components/data-table/data-table.model';
import { ResourcePage } from '../../components/resource-page/resource-page';
import { createResourceList } from '../../services/resource-list.store';
import { formatActive, orNull } from '../../utils/format';
import { listWorkers } from './workers.data';
import type { Worker } from './worker.model';

/**
 * The workshop team.
 *
 * It sits beside the OfficeGest pages and is built from the same machinery —
 * `ResourcePage`, `createResourceList`, the shared formatters — so it gets the
 * identical search debouncing, request cancellation, skeleton-on-first-load and
 * mobile card layout for a column definition and a fetch.
 *
 * ⚠️ The data, however, is NOT from OfficeGest: that API publishes customers,
 * vehicles, service orders and appointments, and no staff resource. The roster
 * is local. See `workers.data.ts`.
 *
 * The rows do not link anywhere: there is no per-worker record to open, and a
 * link to a page that only repeats the row is worse than no link. `rowLink` is
 * optional on `ResourcePage` for exactly this case.
 *
 * The data is local — see `workers.data.ts` for why, and for the one line that
 * changes when a staff endpoint exists.
 */
interface WorkerFilters {
  readonly search?: string;
}

@Component({
  selector: 'app-workers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePage],
  template: `
    <app-resource-page
      title="Trabalhadores"
      subtitle="A equipa da oficina. Mantida localmente — o OfficeGest não publica pessoal."
      caption="Lista de trabalhadores"
      searchLabel="Pesquisar trabalhadores"
      searchPlaceholder="Nome, função ou especialidade…"
      [searchValue]="store.filters().search ?? ''"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      (search)="store.setFilters({ search: $event || undefined })"
    />
  `,
})
export class Workers {
  protected readonly store = createResourceList<Worker, WorkerFilters>({
    fetch: (query) => listWorkers(query),
    initialFilters: {},
  });

  protected readonly rowKey = (worker: Worker): string => worker.id;

  protected readonly columns: readonly TableColumn<Worker>[] = [
    {
      key: 'name',
      header: 'Nome',
      value: (worker) => orNull(worker.name),
      sortValue: (worker) => worker.name,
      priority: 'primary',
    },
    {
      key: 'role',
      header: 'Função',
      value: (worker) => orNull(worker.role),
      sortValue: (worker) => worker.role,
      priority: 'secondary',
    },
    {
      key: 'speciality',
      header: 'Especialidade',
      value: (worker) => orNull(worker.speciality),
    },
    {
      key: 'phone',
      header: 'Telefone',
      value: (worker) => orNull(worker.phone),
    },
    {
      key: 'email',
      header: 'E-mail',
      value: (worker) => orNull(worker.email),
      priority: 'detail',
    },
    {
      // The year alone: the exact day is noise in a roster, and sorting on the
      // ISO string still orders correctly because it is fixed-width.
      key: 'since',
      header: 'Desde',
      value: (worker) => worker.since?.slice(0, 4) ?? null,
      sortValue: (worker) => worker.since ?? null,
      align: 'end',
      numeric: true,
    },
    {
      key: 'active',
      header: 'Estado',
      value: (worker) => formatActive(worker.active),
      badge: true,
      align: 'end',
    },
  ];
}
