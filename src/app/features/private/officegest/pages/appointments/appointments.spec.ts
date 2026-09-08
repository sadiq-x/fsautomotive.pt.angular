/**
 * The bookings list.
 *
 * These assert the decisions this page owns — the default window, what reaches
 * the backend as a filter, and that a reload really re-fetches. The debounce
 * and the cancellation of stale responses are not tested here because this page
 * does not implement them: they belong to `SearchField` and to
 * `resource-list.store`, and are covered where they live.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';

import type { Paged } from '../../../../../core/models/api.model';
import type { Appointment } from '../../models';
import type { AppointmentListQuery } from '../../models/officegest.requests';
import { OfficeGestService } from '../../services/officegest.service';
import { Appointments } from './appointments';

const PAGE: Paged<Appointment> = {
  items: [{ id: '1', title: '30-99-IG / Revisão', startsAt: '2026-09-14T07:30:00.000Z' }],
  pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 },
};

/** Records what the page asked the backend for. */
function setup() {
  const queries: AppointmentListQuery[] = [];

  const officegest = {
    listAppointments: (query: AppointmentListQuery): Observable<Paged<Appointment>> => {
      queries.push(query);
      return of(PAGE);
    },
    employeeNames: (): Observable<ReadonlyMap<string, string>> => of(new Map([['8', 'Miguel']])),
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(Appointments);
  fixture.detectChanges();

  const component = fixture.componentInstance as unknown as {
    store: {
      setFilters: (patch: Record<string, unknown>) => void;
      reload: () => void;
      filters: () => Record<string, unknown>;
    };
    resetFilters: () => void;
  };

  return { fixture, queries, component };
}

/** The last query the page issued. */
function latest(queries: readonly AppointmentListQuery[]): AppointmentListQuery {
  const query = queries.at(-1);

  if (!query) {
    throw new Error('the page issued no request');
  }

  return query;
}

describe('Appointments', () => {
  it('asks for the current calendar month on load', () => {
    const { queries } = setup();
    const query = latest(queries);
    const now = new Date();

    const from = new Date(query.from as string);
    const to = new Date(query.to as string);

    expect(from.getFullYear()).toBe(now.getFullYear());
    expect(from.getMonth()).toBe(now.getMonth());
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);

    // Day 0 of next month is the last day of this one — correct in February,
    // and in a leap year, without a table of month lengths.
    expect(to.getMonth()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getMonth());
    expect(to.getDate()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    expect(to.getHours()).toBe(23);
  });

  it('sends the state filter to the backend rather than filtering on screen', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ status: 'completed' });
    fixture.detectChanges();

    expect(latest(queries).status).toBe('completed');
  });

  it('sends the search term, and drops it when cleared', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ search: 'revisao' });
    fixture.detectChanges();
    expect(latest(queries).search).toBe('revisao');

    component.store.setFilters({ search: undefined });
    fixture.detectChanges();
    expect(latest(queries).search).toBeUndefined();
  });

  it('keeps the date range while the other filters change', () => {
    const { component, fixture, queries } = setup();
    const { from, to } = latest(queries);

    component.store.setFilters({ status: 'completed', search: 'revisao' });
    fixture.detectChanges();

    expect(latest(queries)).toMatchObject({ from, to, status: 'completed', search: 'revisao' });
  });

  it('re-fetches with the filters intact when reloaded', () => {
    const { component, fixture, queries } = setup();

    component.store.setFilters({ status: 'confirmed' });
    fixture.detectChanges();
    const before = queries.length;

    component.store.reload();
    fixture.detectChanges();

    expect(queries.length).toBe(before + 1);
    expect(latest(queries).status).toBe('confirmed');
  });

  it('restores the month and clears the filters on reset', () => {
    const { component, fixture, queries } = setup();
    const original = latest(queries);

    component.store.setFilters({
      status: 'completed',
      search: 'x',
      from: '2020-01-01T00:00:00.000Z',
      to: '2020-01-31T00:00:00.000Z',
    });
    fixture.detectChanges();

    component.resetFilters();
    fixture.detectChanges();

    expect(latest(queries)).toMatchObject({
      from: original.from,
      to: original.to,
      status: undefined,
      search: undefined,
    });
  });

  /**
   * The default "any filter with a value counts" rule would treat the mandatory
   * date range as a narrowing filter, and the empty state would then offer to
   * clear filters the screen cannot work without.
   */
  it('does not consider the mandatory date range an active filter', () => {
    const { component, fixture } = setup();
    const store = component.store as unknown as { isFiltered: () => boolean };

    expect(store.isFiltered()).toBe(false);

    component.store.setFilters({ search: 'revisao' });
    fixture.detectChanges();

    expect(store.isFiltered()).toBe(true);
  });
});
