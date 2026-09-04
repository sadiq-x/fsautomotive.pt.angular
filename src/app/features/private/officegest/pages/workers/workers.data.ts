/**
 * The workshop roster, and the query that reads it.
 *
 * WHY A LOCAL SOURCE
 * ------------------
 * There is no staff endpoint. OfficeGest publishes four resources — customers,
 * vehicles, service orders and appointments (see `container.ts` in the backend)
 * — and none of them is a team list. Rather than invent a backend module
 * against an upstream API that may not have one, the roster lives here.
 *
 * WHY IT STILL RETURNS `Paged<Worker>`
 * ------------------------------------
 * Because that is what `createResourceList` consumes, so the page gets the
 * identical search, pagination, cancellation and empty/error handling as the
 * four real resource pages — and swapping in a real endpoint later is one line
 * in `workers.ts`:
 *
 *     fetch: (query) => this.officegest.listWorkers(query)
 *
 * Nothing else on the page changes. That is the whole reason for matching the
 * shape rather than rendering the array directly.
 */
import { delay, of, type Observable } from 'rxjs';

import type { Paged } from '../../../../../core/models/api.model';
import type { Worker } from './worker.model';

/**
 * Enough delay for the skeleton to be seen rather than flash.
 *
 * A synchronous `of()` would resolve inside the same tick the store starts the
 * request, so the loading path would never render and would rot untested. This
 * also keeps the page honest about what it will feel like once a real endpoint
 * is behind it.
 */
const LATENCY_MS = 120;

/** The team. Edit here until a staff endpoint exists. */
export const WORKERS: readonly Worker[] = [
  {
    id: 'w-1',
    name: 'Miguel Faria',
    role: 'Chefe de oficina',
    speciality: 'Diagnóstico e mecânica multimarca',
    email: 'fsautomotive.servicos@gmail.com',
    phone: '933 678 865',
    since: '2015-03-01',
    active: true,
  },
  {
    id: 'w-2',
    name: 'André Rocha',
    role: 'Mecânico',
    speciality: 'Motor e transmissão',
    since: '2018-09-10',
    active: true,
  },
  {
    id: 'w-3',
    name: 'Bruno Cardoso',
    role: 'Eletricista auto',
    speciality: 'Eletricidade e eletrónica',
    since: '2020-01-20',
    active: true,
  },
  {
    id: 'w-4',
    name: 'Carla Nunes',
    role: 'Rececionista',
    speciality: 'Atendimento e marcações',
    email: 'fsautomotive.servicos@gmail.com',
    since: '2021-06-14',
    active: true,
  },
  {
    id: 'w-5',
    name: 'Tiago Melo',
    role: 'Pintor',
    speciality: 'Pintura e chapa',
    since: '2019-11-02',
    active: true,
  },
];

export interface WorkerListQuery {
  readonly page: number;
  readonly perPage: number;
  readonly search?: string;
}

/** The fields a search term is matched against. */
function haystack(worker: Worker): string {
  return [worker.name, worker.role, worker.speciality, worker.email, worker.phone]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

/**
 * Filters and pages the roster, in the shape a list page consumes.
 *
 * `total` is always reported, unlike some OfficeGest endpoints — the array is
 * right here, so claiming to have counted it is honest.
 */
export function listWorkers(query: WorkerListQuery): Observable<Paged<Worker>> {
  const term = query.search?.trim().toLowerCase();
  const matched = term ? WORKERS.filter((worker) => haystack(worker).includes(term)) : WORKERS;

  const start = (query.page - 1) * query.perPage;

  return of<Paged<Worker>>({
    items: matched.slice(start, start + query.perPage),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total: matched.length,
      totalPages: Math.max(1, Math.ceil(matched.length / query.perPage)),
    },
  }).pipe(delay(LATENCY_MS));
}
