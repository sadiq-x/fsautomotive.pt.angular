/**
 * The work-orders list.
 *
 * These pin the decisions this page owns — the default window and what reaches
 * the backend as a filter. Debouncing belongs to `SearchField` and stale-response
 * cancellation to `resource-list.store`; both are covered where they live, and
 * asserting them again here would only test that the page uses them.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';

import type { Paged } from '../../../../../core/models/api.model';
import type { ServiceOrder } from '../../models';
import type { ServiceOrderListQuery } from '../../models/officegest.requests';
import { OfficeGestService } from '../../services/officegest.service';
import { ServiceOrders } from './service-orders';

const PAGE: Paged<ServiceOrder> = {
  items: [{ id: '621', number: 'OSV BF2026/621', openedAt: '2026-09-08T00:00:00.000Z' }],
  pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 },
};

function setup() {
  const queries: ServiceOrderListQuery[] = [];

  const officegest = {
    listServiceOrders: (query: ServiceOrderListQuery): Observable<Paged<ServiceOrder>> => {
      queries.push(query);
      return of(PAGE);
    },
    employeeNames: (): Observable<ReadonlyMap<string, string>> => of(new Map()),
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(ServiceOrders);
  fixture.detectChanges();

  const component = fixture.componentInstance as unknown as {
    store: {
      setFilters: (patch: Record<string, unknown>) => void;
      reload: () => void;
      isFiltered: () => boolean;
    };
    resetFilters: () => void;
    onPlate: (raw: string) => void;
  };

  return { fixture, queries, component };
}

function latest(queries: readonly ServiceOrderListQuery[]): ServiceOrderListQuery {
  const query = queries.at(-1);

  if (!query) {
    throw new Error('the page issued no request');
  }

  return query;
}

describe('ServiceOrders', () => {
  it('asks for the current calendar month on load', () => {
    const { queries } = setup();
    const now = new Date();
    const from = new Date(latest(queries).from as string);
    const to = new Date(latest(queries).to as string);

    expect(from.getMonth()).toBe(now.getMonth());
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
    expect(to.getDate()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    expect(to.getHours()).toBe(23);
  });

  it('sends the state filter to the backend', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ status: 'FAC' });
    fixture.detectChanges();

    expect(latest(queries).status).toBe('FAC');
  });

  it('sends the search term, and drops it when cleared', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ search: 'travoes' });
    fixture.detectChanges();
    expect(latest(queries).search).toBe('travoes');

    component.store.setFilters({ search: undefined });
    fixture.detectChanges();
    expect(latest(queries).search).toBeUndefined();
  });

  it('applies every filter together, keeping the window', () => {
    const { component, fixture, queries } = setup();
    const { from, to } = latest(queries);

    component.store.setFilters({ status: 'FAC', search: 'ana' });
    component.onPlate('61-SQ-64');
    fixture.detectChanges();

    expect(latest(queries)).toMatchObject({
      from,
      to,
      status: 'FAC',
      search: 'ana',
      plate: '61SQ64',
    });
  });

  /** A partial plate would filter the list down to nothing while typing. */
  it('holds back an incomplete plate', () => {
    const { component, fixture, queries } = setup();

    component.onPlate('61-SQ');
    fixture.detectChanges();

    expect(latest(queries).plate).toBeUndefined();
  });

  it('re-fetches with the filters intact when reloaded', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ status: 'ESP' });
    fixture.detectChanges();
    const before = queries.length;

    component.store.reload();
    fixture.detectChanges();

    expect(queries.length).toBe(before + 1);
    expect(latest(queries).status).toBe('ESP');
  });

  it('restores the month and clears every filter on reset', () => {
    const { component, fixture, queries } = setup();
    const original = latest(queries);

    component.store.setFilters({
      status: 'FAC',
      search: 'x',
      plate: '61SQ64',
      from: '2020-01-01T00:00:00.000Z',
    });
    fixture.detectChanges();

    component.resetFilters();
    fixture.detectChanges();

    expect(latest(queries)).toMatchObject({
      from: original.from,
      to: original.to,
      status: undefined,
      search: undefined,
      plate: undefined,
    });
  });

  it('does not consider the mandatory date range an active filter', () => {
    const { component, fixture } = setup();

    expect(component.store.isFiltered()).toBe(false);

    component.store.setFilters({ search: 'ana' });
    fixture.detectChanges();

    expect(component.store.isFiltered()).toBe(true);
  });
});
