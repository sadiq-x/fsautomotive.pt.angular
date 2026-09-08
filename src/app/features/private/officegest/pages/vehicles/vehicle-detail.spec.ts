/**
 * One vehicle.
 *
 * The two behaviours worth pinning are the ones that were wrong or absent: that
 * the page asks for the plate it was given, and that "last intervention" — a
 * fact that does not exist on a vehicle record — is derived from that plate's
 * work orders without being able to break the page.
 */
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';

import { ApiError, type Paged } from '../../../../../core/models/api.model';
import type { ServiceOrder, Vehicle } from '../../models';
import type { ServiceOrderListQuery } from '../../models/officegest.requests';
import { OfficeGestService } from '../../services/officegest.service';
import { VehicleDetail } from './vehicle-detail';

const VEHICLE: Vehicle = {
  plate: '0000ZZ',
  description: 'RENAULT CLIO 1.5 DCI',
  brand: 'Renault',
  model: 'Clio',
  fuel: 'Gasóleo',
  color: 'Cinzento',
  vin: 'VF1000000000000',
  mileage: 184_320,
  monthlyMileage: 1_500,
  nextInspectionAt: '2027-03-01T00:00:00.000Z',
  customerId: '4210',
  ownerName: 'Ana Silva',
  active: true,
};

const ORDERS: Paged<ServiceOrder> = {
  items: [
    { id: '621', number: 'OSV BF2026/621', openedAt: '2026-08-14T00:00:00.000Z' },
    { id: '540', number: 'OSV BF2026/540', openedAt: '2026-02-02T00:00:00.000Z' },
  ],
  pagination: { page: 1, perPage: 5 },
};

interface Overrides {
  readonly vehicle?: Observable<Vehicle>;
  readonly serviceOrders?: Observable<Paged<ServiceOrder>>;
}

function setup(overrides: Overrides = {}) {
  const plateRequests: string[] = [];
  const orderQueries: ServiceOrderListQuery[] = [];

  const officegest = {
    getVehicle: (plate: string): Observable<Vehicle> => {
      plateRequests.push(plate);
      return overrides.vehicle ?? of(VEHICLE);
    },
    listServiceOrders: (query: ServiceOrderListQuery): Observable<Paged<ServiceOrder>> => {
      orderQueries.push(query);
      return overrides.serviceOrders ?? of(ORDERS);
    },
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: OfficeGestService, useValue: officegest },
    ],
  });

  const fixture = TestBed.createComponent(VehicleDetail);
  fixture.componentRef.setInput('plate', '0000ZZ');
  fixture.detectChanges();

  const component = fixture.componentInstance as unknown as {
    fields: () => readonly { label: string; value: string | null }[];
    history: () => readonly { id: string }[];
    links: () => readonly { label: string; route: string }[];
    subtitle: () => string | null;
  };

  return { fixture, component, plateRequests, orderQueries };
}

function valueOf(
  fields: readonly { label: string; value: string | null }[],
  label: string,
): string | null | undefined {
  return fields.find((field) => field.label === label)?.value;
}

describe('VehicleDetail', () => {
  it('asks for the plate it was routed with', () => {
    const { plateRequests } = setup();

    expect(plateRequests).toEqual(['0000ZZ']);
  });

  it('shows the fields the page used to omit', () => {
    const { component } = setup();
    const fields = component.fields();

    expect(valueOf(fields, 'Combustível')).toBe('Gasóleo');
    expect(valueOf(fields, 'Cor')).toBe('Cinzento');
    expect(valueOf(fields, 'Chassis (VIN)')).toBe('VF1000000000000');
    expect(valueOf(fields, 'Proprietário')).toBe('Ana Silva');
    // The grouping character comes from the runtime's Intl data, so only the
    // unit is asserted — the number's formatting is `format.ts`'s business.
    expect(valueOf(fields, 'Média mensal')).toMatch(/^1.?500 km\/mês$/);
    expect(valueOf(fields, 'Estado')).toBe('Ativo');
    expect(valueOf(fields, 'Próxima inspeção')).toBeTruthy();
  });

  /** A dash per absent field reads as a broken page rather than an empty value. */
  it('omits a field the record does not carry', () => {
    const { component } = setup({
      vehicle: of({ plate: '0000ZZ' }),
      // Otherwise the derived "last intervention" would legitimately appear.
      serviceOrders: of({ items: [], pagination: { page: 1, perPage: 5 } }),
    });
    const labels = component.fields().map((field) => field.label);

    expect(labels).toEqual(['Matrícula']);
  });

  it('derives the last intervention from that plate’s work orders', () => {
    const { component, orderQueries } = setup();

    expect(orderQueries.at(0)).toMatchObject({ plate: '0000ZZ', page: 1 });
    // 14/08/2026 — the newest job, which is what the backend returns first.
    expect(valueOf(component.fields(), 'Última intervenção')).toBe('14/08/2026');
    expect(component.history()).toHaveLength(2);
  });

  /**
   * Work orders sit behind their own permission. A vehicle page without a
   * history is useful; one that errors because a supplementary list failed is
   * not.
   */
  it('still renders when the work orders cannot be read', () => {
    const { component } = setup({
      serviceOrders: throwError(() => new ApiError(403, 'FORBIDDEN', 'sem permissão')),
    });

    expect(component.history()).toHaveLength(0);
    expect(valueOf(component.fields(), 'Última intervenção')).toBeUndefined();
    expect(valueOf(component.fields(), 'Matrícula')).toBe('00-00-ZZ');
  });

  it('links to the owner, and not twice when the billing customer is the same', () => {
    const { component } = setup();

    expect(component.links()).toEqual([
      { label: 'Ver o cliente Ana Silva', route: '/private/customers/4210' },
    ]);
  });

  it('links to the billing customer when it is someone else', () => {
    const { component } = setup({
      vehicle: of({ ...VEHICLE, billingCustomerId: '9001' }),
    });

    expect(component.links().map((link) => link.route)).toEqual([
      '/private/customers/4210',
      '/private/customers/9001',
    ]);
  });
});
