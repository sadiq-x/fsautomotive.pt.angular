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

  /**
   * The misconception this pins. A single sampled list row looked like seven
   * fields, because OfficeGest omits the null ones — so these were assumed to
   * be detail-only and went unread, which is why the columns showed dashes.
   * Across the 2 613 vehicles on the tenant they are on list rows too.
   */
  it('reads the fields a list row was assumed not to carry', () => {
    const row = {
      ...listRecord,
      color: 'Cinzento',
      fuel_id: 17,
      monthly_kms: 1500,
      next_inspection_date: '2027-03-01',
      created_at: '2026-02-17 10:00:00',
    };

    expect(toVehicle(row)).toMatchObject({
      color: 'Cinzento',
      fuelId: 17,
      monthlyMileage: 1500,
      vin: 'VF1000000000000',
      active: true,
    });
    expect(toVehicle(row)?.nextInspectionAt).toMatch(/^2027-03-01/);
    expect(toVehicle(row)?.registeredAt).toMatch(/^2026-02-17/);
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

  /**
   * `status` is the tenant's own code and stays the code, on both endpoints.
   * Letting the detail-only `status_name` overwrite it made the same job read
   * "FAC" in the list and "n4482" on its own page.
   */
  it('keeps the status code, and carries a readable status_name beside it', () => {
    const mapped = toServiceOrder({ ...record, status: 'TCP', status_name: 'Trabalhos Complexos' });

    expect(mapped?.status).toBe('TCP');
    expect(mapped?.statusName).toBe('Trabalhos Complexos');
  });

  /**
   * Most of this tenant's `status_name` values are untranslated tokens. The
   * code the mechanic already recognises is better than "n4482".
   */
  it('discards an untranslated status_name token', () => {
    const mapped = toServiceOrder({ ...record, status: 'FAC', status_name: 'n4482' });

    expect(mapped?.status).toBe('FAC');
    expect(mapped?.statusName).toBeUndefined();
  });

  it('reads the fields that were previously dropped', () => {
    const mapped = toServiceOrder({
      ...record,
      invoice_name: 'Ana Silva',
      km_counter: 128_400,
      mechanic_id: 8,
      is_cancelled: true,
      awaiting_parts: true,
      priority: 2,
      expected_delivery_date: '2026-09-12',
    });

    expect(mapped).toMatchObject({
      customerName: 'Ana Silva',
      mileage: 128_400,
      mechanicId: '8',
      cancelled: true,
      awaitingParts: true,
      priority: 2,
    });
    expect(mapped?.expectedDeliveryAt).toMatch(/^2026-09-12/);
  });

  it('maps the billed lines, and leaves them absent on a list row', () => {
    expect(toServiceOrder(record)?.lines).toBeUndefined();

    const mapped = toServiceOrder({
      ...record,
      lines: [{ id: 1, description: 'Pastilhas', quantity: 4, unit_price: 12.5, total: 61.5 }],
      extra_lines: [{ id: 2, description: 'Mão de obra', quantity: 1, unit_price: 40 }],
    });

    expect(mapped?.lines).toEqual([
      { id: '1', description: 'Pastilhas', quantity: 4, unitPrice: 12.5, total: 61.5 },
      { id: '2', description: 'Mão de obra', quantity: 1, unitPrice: 40, total: undefined },
    ]);
  });

  it('skips a malformed line rather than losing the whole job', () => {
    const mapped = toServiceOrder({ ...record, lines: [null, 'nonsense', { id: 3 }] });

    expect(mapped?.lines).toHaveLength(1);
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
