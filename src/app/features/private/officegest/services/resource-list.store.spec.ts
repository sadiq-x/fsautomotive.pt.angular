/**
 * The pagination contract every list page inherits.
 *
 * These are the properties a user notices immediately when they break: landing
 * on a page of the wrong size, changing the size and staying on page 7 of a
 * list that no longer has one, or a "next" that fetches the page just left.
 *
 * The count is tested separately because it is the one thing OfficeGest cannot
 * answer — it reports no total on any list endpoint — so the total is
 * established by an explicit action and must not be spent on a page load.
 */
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';

import type { Paged } from '../../../../core/models/api.model';
import type { ResourceCount } from '../models/officegest.models';
import {
  DEFAULT_PER_PAGE,
  PAGE_SIZE_OPTIONS,
  createResourceList,
  type ListQueryOf,
} from './resource-list.store';

interface Row {
  readonly id: string;
}

interface Filters {
  readonly search?: string;
}

/** Records every query the store issued, and answers each with a full page. */
function setup(options: { count?: () => Observable<ResourceCount> } = {}) {
  const queries: ListQueryOf<Filters>[] = [];

  const store = runInInjectionContext(TestBed.inject(Injector), () =>
    createResourceList<Row, Filters>({
      fetch: (query): Observable<Paged<Row>> => {
        queries.push(query);
        return of({
          items: Array.from({ length: query.perPage }, (_, i) => ({ id: `${query.page}-${i}` })),
          pagination: { page: query.page, perPage: query.perPage },
        });
      },
      count: options.count,
      initialFilters: {},
      injector: TestBed.inject(Injector),
    }),
  );

  // The store fetches through `toObservable`, which emits on the microtask queue.
  const settle = async () => {
    TestBed.tick();
    await Promise.resolve();
  };

  return { store, queries, settle };
}

describe('createResourceList pagination', () => {
  it('asks for ten rows by default', async () => {
    const { queries, settle } = setup();
    await settle();

    expect(DEFAULT_PER_PAGE).toBe(10);
    expect(queries[0]).toMatchObject({ page: 1, perPage: 10 });
  });

  it('offers 10, 25, 50 and 100 as page sizes', () => {
    expect([...PAGE_SIZE_OPTIONS]).toEqual([10, 25, 50, 100]);
  });

  it('fetches the page it was asked for', async () => {
    const { store, queries, settle } = setup();
    await settle();

    store.setPage(3);
    await settle();

    expect(queries.at(-1)).toMatchObject({ page: 3, perPage: 10 });
    expect(store.page()).toBe(3);
  });

  /**
   * Page 7 of a 10-row list is not page 7 of a 100-row one, and an out-of-range
   * page comes back empty — which reads as "no results" rather than as a paging
   * mistake.
   */
  it('returns to page 1 when the page size changes', async () => {
    const { store, queries, settle } = setup();
    await settle();

    store.setPage(4);
    await settle();
    store.setPerPage(50);
    await settle();

    expect(store.page()).toBe(1);
    expect(queries.at(-1)).toMatchObject({ page: 1, perPage: 50 });
  });

  it('returns to page 1 when a filter changes', async () => {
    const { store, queries, settle } = setup();
    await settle();

    store.setPage(5);
    await settle();
    store.setFilters({ search: 'silva' });
    await settle();

    expect(store.page()).toBe(1);
    expect(queries.at(-1)).toMatchObject({ page: 1, search: 'silva' });
  });
});

describe('createResourceList counting', () => {
  it('does not count on load — the total costs upstream requests', async () => {
    const count = vi.fn(() => of({ total: 1276, exact: true }));
    const { store, settle } = setup({ count });
    await settle();

    expect(count).not.toHaveBeenCalled();
    expect(store.countStatus()).toBe('idle');
    expect(store.count()).toBeNull();
  });

  it('reports the total once asked', async () => {
    const { store, settle } = setup({ count: () => of({ total: 1276, exact: true }) });
    await settle();

    store.countTotal();
    await settle();

    expect(store.count()).toEqual({ total: 1276, exact: true });
    expect(store.countStatus()).toBe('done');
  });

  // The sweep is bounded, so a very large collection yields a floor.
  it('keeps the "not exact" flag, so the page can say "more than"', async () => {
    const { store, settle } = setup({ count: () => of({ total: 5000, exact: false }) });
    await settle();

    store.countTotal();
    await settle();

    expect(store.count()?.exact).toBe(false);
  });

  it('surfaces a failed count without disturbing the list', async () => {
    const { store, settle } = setup({ count: () => throwError(() => new Error('nope')) });
    await settle();

    store.countTotal();
    await settle();

    expect(store.countStatus()).toBe('failed');
    expect(store.items().length).toBe(10);
  });

  // A total describes the filters it was taken under.
  it('discards the count when the filters change', async () => {
    const { store, settle } = setup({ count: () => of({ total: 1276, exact: true }) });
    await settle();

    store.countTotal();
    await settle();
    store.setFilters({ search: 'silva' });
    await settle();

    expect(store.count()).toBeNull();
    expect(store.countStatus()).toBe('idle');
  });

  it('offers no count action when the page supplies no counter', async () => {
    const { store, settle } = setup();
    await settle();

    expect(store.countStatus()).toBe('unavailable');
  });
});
