/**
 * The upstream field names, pinned against real payload shapes.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Every field below was read through a *guessed* candidate name until the
 * tenant's permissions were granted and real payloads could be inspected
 * (2026-09-07). Several guesses were wrong, and being wrong was silent: the
 * reader returns `undefined`, the API answers 200 with a well-formed object,
 * and the screen renders blanks. One was worse — a work order has no `id`, so
 * every record was dropped and the list rendered "no records" over a full page
 * of data.
 *
 * The records here are shaped exactly like the tenant's, with invented values.
 * If a mapper is "tidied" back to a plausible-looking name, these fail.
 */
import { describe, expect, it } from 'vitest';

import { toCustomer } from './customers/customer.mapper.js';
import { toVehicle } from './vehicles/vehicle.mapper.js';
import { toServiceOrder, toServiceOrders } from './service-orders/service-order.mapper.js';
import { toAppointment } from './appointments/appointment.mapper.js';

describe('customer mapping', () => {
  const record = {
    id: 4210,
    name: 'Oficina Exemplo Lda',
    tax_id: '500000000',
    email: 'exemplo@example.pt',
    phone: '219000000',
    mobile_phone: '+351910000000',
    city: 'Vialonga',
    postal_code: '2625-585',
    country_code: 'PT',
    country: { country_code: 'PT', name: 'Portugal', currency_code: 'EUR' },
    active: true,
  };

  it('reads the mobile from `mobile_phone`', () => {
    expect(toCustomer(record)?.mobile).toBe('+351910000000');
  });

  // `country` is an object; a plain string read of it silently produced
  // `undefined` on every customer.
  it('reads the country through the nested object, not the object itself', () => {
    expect(toCustomer(record)?.country).toBe('Portugal');
  });

  it('falls back to the flat country code when the object is absent', () => {
    const { country, ...withoutObject } = record;
    expect(toCustomer(withoutObject)?.country).toBe('PT');
  });

  it('still reads the plain fields', () => {
    const customer = toCustomer(record);
    expect(customer).toMatchObject({ id: '4210', taxId: '500000000', phone: '219000000' });
  });
});

describe('vehicle mapping', () => {
  const listRecord = {
    plate: 'AA-00-BB',
    description: 'RENAULT CLIO 1.5 DCI',
    brand_id: 12,
    model_id: 340,
    vin: 'VF1000000000000',
    km_counter: 184320,
    owner_customer_id: 4210,
    is_active: true,
  };

  it('reads the mileage from `km_counter`', () => {
    expect(toVehicle(listRecord)?.mileage).toBe(184320);
  });

  it('reads the owner from `owner_customer_id`', () => {
    expect(toVehicle(listRecord)?.customerId).toBe('4210');
  });

  // The only human-readable field a list row has.
  it('publishes the description', () => {
    expect(toVehicle(listRecord)?.description).toBe('RENAULT CLIO 1.5 DCI');
  });

  it('prefers the detail record’s brand and model names when present', () => {
    const detail = { ...listRecord, brand_name: 'Renault', model_name: 'Clio' };
    expect(toVehicle(detail)).toMatchObject({ brand: 'Renault', model: 'Clio' });
  });
});

describe('service order mapping', () => {
  const record = {
    number: 25143,
    document_number: 'FO 2026/143',
    date: '2026-09-01',
    customer_id: 4210,
    total: '184.50',
    status: 'ABE',
    plate: 'AA-00-BB',
    is_cancelled: false,
  };

  /**
   * The regression that mattered: `id` was the only identifier candidate, no
   * work order has one, so every record was filtered out of every page.
   */
  it('identifies a work order by `number`, not a missing `id`', () => {
    expect(toServiceOrder(record)?.id).toBe('25143');
    expect(toServiceOrders([record, { ...record, number: 25144 }])).toHaveLength(2);
  });

  it('does not drop a full page of records', () => {
    const page = Array.from({ length: 15 }, (_, i) => ({ ...record, number: 25000 + i }));
    expect(toServiceOrders(page)).toHaveLength(15);
  });

  it('reads the opening date from `date` and the total from a numeric string', () => {
    expect(toServiceOrder(record)).toMatchObject({ total: 184.5, plate: 'AA00BB' });
    expect(toServiceOrder(record)?.openedAt).toMatch(/^2026-09-01/);
  });

  it('prefers the readable `status_name` when the detail record supplies it', () => {
    expect(toServiceOrder({ ...record, status_name: 'Em curso' })?.status).toBe('Em curso');
  });
});

describe('appointment mapping', () => {
  const base = {
    id: 90210,
    title: 'Revisão',
    start: '2026-09-10 09:00:00',
    end: '2026-09-10 10:00:00',
    confirmed: false,
    completed: false,
    no_show: false,
  };

  it('reads the times from `start` and `end`', () => {
    const appointment = toAppointment(base);
    expect(appointment?.startsAt).toMatch(/^2026-09-10/);
    expect(appointment?.endsAt).toMatch(/^2026-09-10/);
  });

  // Upstream has no status field — the state lives in three booleans.
  it('folds the booleans into a status, most final first', () => {
    expect(toAppointment({ ...base, confirmed: true })?.status).toBe('confirmed');
    expect(toAppointment({ ...base, no_show: true, confirmed: true })?.status).toBe('no_show');
    expect(toAppointment({ ...base, completed: true, no_show: true })?.status).toBe('completed');
  });

  // Inventing "scheduled" would state something the record does not.
  it('leaves the status unset when no boolean is', () => {
    expect(toAppointment(base)?.status).toBeUndefined();
  });
});
