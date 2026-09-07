import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import type { TableColumn } from '../../components/data-table/data-table.model';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { Employee } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { formatActive, orNull } from '../../utils/format';

/**
 * The workshop team.
 *
 * WHERE THE DATA COMES FROM, AND WHY THAT CHANGED
 * -----------------------------------------------
 * This page used to render a roster typed by hand into `workers.data.ts`, on
 * the stated grounds that "OfficeGest publishes no staff resource". That was
 * wrong: `/entities/employees` exists, and it is the only staff resource the API
 * has — `/entities/users`, `/users` and `/hr/employees` all answer 404. It
 * carries HR facts (name, contacts, department) *and* login facts (`login`,
 * `web_active`, `permissions_group`), so the "employees or system users?"
 * question has one answer here: they are the same records.
 *
 * NO PAGER, DELIBERATELY
 * ----------------------
 * The endpoint returns the whole roster in one request — twelve people, with
 * `hasMore: false` — so the page asks for the maximum page size and renders
 * everything, and `paginated` is off. Should a company ever outgrow that, the
 * backend logs a warning and `pagination().hasMore` turns true; switching this
 * page back on is deleting one attribute.
 *
 * The rows do not link anywhere: there is no per-worker record to open.
 */
interface WorkerFilters {
  readonly search?: string;
}

/** The backend's maximum, which is what "fetch them all" costs here. */
const ROSTER_PAGE_SIZE = 100;

@Component({
  selector: 'app-workers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResourcePage],
  template: `
    <app-resource-page
      title="Trabalhadores"
      countNoun="trabalhadores"
      subtitle="A equipa da oficina, sincronizada com o OfficeGest."
      caption="Lista de trabalhadores"
      searchLabel="Pesquisar trabalhadores"
      searchPlaceholder="Nome do trabalhador…"
      [paginated]="false"
      [searchValue]="store.filters().search ?? ''"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      (search)="store.setFilters({ search: $event || undefined })"
    />
  `,
})
export class Workers {
  private readonly officegest = inject(OfficeGestService);

  protected readonly store = createResourceList<Employee, WorkerFilters>({
    fetch: (query) => this.officegest.listEmployees(query),
    initialFilters: {},
    perPage: ROSTER_PAGE_SIZE,
  });

  protected readonly rowKey = (worker: Employee): string => worker.id;

  protected readonly columns: readonly TableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Nome',
      value: (worker) => orNull(worker.name),
      sortValue: (worker) => worker.name,
      priority: 'primary',
    },
    {
      key: 'login',
      header: 'Utilizador',
      value: (worker) => orNull(worker.login),
      sortValue: (worker) => worker.login ?? null,
      priority: 'secondary',
    },
    {
      key: 'email',
      header: 'E-mail',
      value: (worker) => orNull(worker.email),
    },
    {
      key: 'phone',
      header: 'Telefone',
      value: (worker) => orNull(worker.phone),
    },
    {
      // Upstream sends a flag rather than a role, and it is the one fact that
      // says whether someone is scheduled on jobs.
      key: 'agenda',
      header: 'Na agenda',
      value: (worker) =>
        worker.onWorkshopAgenda === undefined ? null : worker.onWorkshopAgenda ? 'Sim' : 'Não',
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
