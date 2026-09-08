/**
 * The dashboard tiles.
 *
 * The regression these exist for: the customers and vehicles tiles read
 * `meta.total` from a list response, and OfficeGest reports no total on those
 * two endpoints — so both showed a permanent dash while the bookings tile,
 * whose total the backend computes itself, showed a real number.
 *
 * The zero and the "inexact" cases are here because they are the two a headline
 * number gets wrong most easily: a legitimate `0` must not be mistaken for
 * "unknown", and a capped sweep must not be printed as if it were the count.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';

import { ApiError, type Paged } from '../../../../../core/models/api.model';
import { AuthService } from '../../../../../core/auth';
import type { Appointment, ResourceCount } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { Dashboard } from './dashboard';

const NO_APPOINTMENTS: Paged<Appointment> = {
  items: [],
  pagination: { page: 1, perPage: 1, total: 7 },
};

interface Overrides {
  readonly customers?: Observable<ResourceCount>;
  readonly vehicles?: Observable<ResourceCount>;
  readonly appointments?: Observable<Paged<Appointment>>;
}

function setup(overrides: Overrides = {}) {
  const officegest = {
    countCustomers: () => overrides.customers ?? of({ total: 1277, exact: true }),
    countVehicles: () => overrides.vehicles ?? of({ total: 2613, exact: true }),
    listAppointments: () => overrides.appointments ?? of(NO_APPOINTMENTS),
  };

  const auth = {
    user: () => ({ name: 'Miguel Faria', permissions: [] }),
    hasPermission: () => false,
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
      { provide: AuthService, useValue: auth },
    ],
  });

  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();

  const component = fixture.componentInstance as unknown as {
    tiles: () => readonly { label: string; text: string | null; metric: { failed: boolean } }[];
  };

  const tile = (label: string) => {
    const found = component.tiles().find((candidate) => candidate.label === label);

    if (!found) {
      throw new Error(`no tile labelled ${label}`);
    }

    return found;
  };

  return { fixture, tile };
}

describe('Dashboard', () => {
  it('shows a real number for the tiles the list endpoints cannot count', () => {
    const { tile } = setup();

    expect(tile('Clientes').text).toMatch(/^1.?277$/);
    expect(tile('Veículos').text).toMatch(/^2.?613$/);
  });

  it('still reads the bookings total from the list response', () => {
    const { tile } = setup();

    expect(tile('Marcações futuras').text).toBe('7');
  });

  /** Zero is a real answer, and must not be rendered as "unknown". */
  it('renders a genuine zero as a number, not a dash', () => {
    const { tile } = setup({ customers: of({ total: 0, exact: true }) });

    expect(tile('Clientes').text).toBe('0');
  });

  /** The sweep is capped; past the cap the total is a floor, not the count. */
  it('says "mais de" when the count is not exact', () => {
    const { tile } = setup({ vehicles: of({ total: 5000, exact: false }) });

    expect(tile('Veículos').text).toMatch(/^mais de 5.?000$/);
  });

  /** A missing total is not zero: it is "we could not count this". */
  it('shows no number when the endpoint reports no total', () => {
    const { tile } = setup({
      appointments: of({ items: [], pagination: { page: 1, perPage: 1 } }),
    });

    expect(tile('Marcações futuras').text).toBeNull();
  });

  it('fails one tile without taking the others down', () => {
    const { tile } = setup({
      customers: throwError(() => new ApiError(403, 'FORBIDDEN', 'sem permissão')),
    });

    expect(tile('Clientes').metric.failed).toBe(true);
    expect(tile('Veículos').text).toMatch(/^2.?613$/);
    expect(tile('Marcações futuras').text).toBe('7');
  });
});
