/**
 * The vehicle list.
 *
 * These pin the decisions this page owns: what reaches the backend as a filter,
 * and what the columns are allowed to promise. Debouncing belongs to
 * `SearchField` and stale-response cancellation to `resource-list.store`; both
 * are covered where they live.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';

import type { Paged } from '../../../../../core/models/api.model';
import type { ResourceCount, Vehicle } from '../../models';
import type { VehicleListQuery } from '../../models/officegest.requests';
import { OfficeGestService } from '../../services/officegest.service';
import { Vehicles } from './vehicles';

const PAGE: Paged<Vehicle> = {
  items: [{ plate: '0000ZZ', description: 'RENAULT CLIO 1.5 DCI' }],
  pagination: { page: 1, perPage: 10 },
};

function setup() {
  const queries: VehicleListQuery[] = [];
  const counts: Partial<VehicleListQuery>[] = [];

  const officegest = {
    listVehicles: (query: VehicleListQuery): Observable<Paged<Vehicle>> => {
      queries.push(query);
      return of(PAGE);
    },
    countVehicles: (filters: Partial<VehicleListQuery>): Observable<ResourceCount> => {
      counts.push(filters);
      return of({ total: 1, exact: true });
    },
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(Vehicles);
  fixture.detectChanges();

  const component = fixture.componentInstance as unknown as {
    store: {
      setFilters: (patch: Record<string, unknown>) => void;
      reload: () => void;
      countTotal: () => void;
    };
    onStatus: (value: string) => void;
    columns: readonly { key: string; value: (row: Vehicle) => string | null }[];
  };

  return { fixture, queries, counts, component };
}

function latest(queries: readonly VehicleListQuery[]): VehicleListQuery {
  const query = queries.at(-1);

  if (!query) {
    throw new Error('the page issued no request');
  }

  return query;
}

describe('Vehicles', () => {
  it('loads the unfiltered list, because a vehicle has no date to window by', () => {
    const { queries } = setup();

    expect(latest(queries)).toMatchObject({ page: 1 });
    expect(latest(queries).search).toBeUndefined();
    expect(latest(queries).status).toBeUndefined();
  });

  it('sends the state filter, and drops it for "all states"', () => {
    const { component, fixture, queries } = setup();

    component.onStatus('inactive');
    fixture.detectChanges();
    expect(latest(queries).status).toBe('inactive');

    component.onStatus('');
    fixture.detectChanges();
    expect(latest(queries).status).toBeUndefined();
  });

  it('sends the search term, and drops it when cleared', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ search: '00-00-ZZ' });
    fixture.detectChanges();
    expect(latest(queries).search).toBe('00-00-ZZ');

    component.store.setFilters({ search: undefined });
    fixture.detectChanges();
    expect(latest(queries).search).toBeUndefined();
  });

  it('applies the search and the state together', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ search: 'clio' });
    component.onStatus('active');
    fixture.detectChanges();

    expect(latest(queries)).toMatchObject({ search: 'clio', status: 'active' });
  });

  it('re-fetches with the filters intact when reloaded', () => {
    const { component, fixture, queries } = setup();

    component.onStatus('active');
    fixture.detectChanges();
    const before = queries.length;

    component.store.reload();
    fixture.detectChanges();

    expect(queries.length).toBe(before + 1);
    expect(latest(queries).status).toBe('active');
  });

  /** A count that ignored the filters would state a total for a different list. */
  it('counts what the filters select', () => {
    const { component, counts, fixture } = setup();

    component.onStatus('inactive');
    fixture.detectChanges();
    component.store.countTotal();

    expect(counts.at(-1)).toMatchObject({ status: 'inactive' });
  });

  /**
   * Both columns were on this table and were empty on every row, because
   * neither field exists upstream under any name. Re-adding one would put the
   * dashes back.
   */
  it('offers no column that can only ever render a dash', () => {
    const { component } = setup();
    const keys = component.columns.map((column) => column.key);

    expect(keys).not.toContain('year');
    expect(keys).not.toContain('lastServiceAt');
  });

  /** The brand alone says less than the tenant's own line, so it does not win. */
  it('falls back to the description when only the brand resolved', () => {
    const { component } = setup();
    const column = component.columns.find((candidate) => candidate.key === 'vehicle');

    expect(column?.value({ plate: '0000ZZ', brand: 'Renault', description: 'CLIO 1.5 DCI' })).toBe(
      'CLIO 1.5 DCI',
    );
    expect(
      column?.value({
        plate: '0000ZZ',
        brand: 'Renault',
        model: 'Clio',
        description: 'CLIO 1.5 DCI',
      }),
    ).toBe('Renault Clio');
  });
});
