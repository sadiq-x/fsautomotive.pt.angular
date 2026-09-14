/**
 * Mapping a monitor row.
 *
 * The records here are the shapes the tenant actually returned on 2026-09-13,
 * trimmed to the fields under test. The mechanic and duration cases use the
 * *documented* shape, which this tenant has never sent — that is exactly why
 * they are pinned here rather than left to be discovered on the day someone
 * finally clocks onto a car.
 */
import { describe, expect, it } from 'vitest';

import { toMonitorServiceOrder, toMonitorServiceOrders } from './workshop-monitor.mapper.js';

describe('toMonitorServiceOrder', () => {
  it('reads the fields the tenant sends on an active board row', () => {
    const order = toMonitorServiceOrder({
      number: 4821,
      document_number: 'OSV BF2024/12',
      status: 'ESP',
      date: '2026-09-10',
      customer_id: 77,
      invoice_name: 'Maria Silva',
      vehicle_plate: '61-SQ-64',
      awaiting_parts: true,
      priority: 3,
      badge_color: '#e11d48',
    });

    expect(order).toMatchObject({
      id: '4821',
      documentNumber: 'OSV BF2024/12',
      status: 'ESP',
      customerId: '77',
      customerName: 'Maria Silva',
      awaitingParts: true,
      priority: 3,
      badgeColor: '#e11d48',
    });
  });

  /** A card with no key cannot be opened, so it is dropped rather than shown. */
  it('drops a record with no number', () => {
    expect(toMonitorServiceOrder({ status: 'ESP' })).toBeUndefined();
    expect(toMonitorServiceOrders([{ status: 'ESP' }, { number: 1 }])).toHaveLength(1);
  });

  /**
   * The plate is stored normalised so a board card and a vehicle page agree on
   * the key, even though upstream sends and matches the hyphenated form.
   */
  it('normalises the plate on the row and on the nested vehicle', () => {
    const order = toMonitorServiceOrder({
      number: 1,
      vehicle_plate: '61-SQ-64',
      vehicle: { plate: '61-SQ-64', brand_name: 'Renault', km_counter: 184_320 },
    });

    expect(order?.plate).toBe('61SQ64');
    expect(order?.vehicle).toMatchObject({ plate: '61SQ64', brand: 'Renault', mileage: 184_320 });
  });

  it('omits the vehicle entirely when it carries nothing usable', () => {
    expect(toMonitorServiceOrder({ number: 1, vehicle: {} })?.vehicle).toBeUndefined();
    expect(toMonitorServiceOrder({ number: 1, vehicle: null })?.vehicle).toBeUndefined();
  });

  describe('mechanics — the documented shape this tenant has never sent', () => {
    it('reads the clock-on the whole feature depends on', () => {
      const order = toMonitorServiceOrder({
        number: 1,
        mechanics: [
          {
            employee_code: 7,
            name: 'João',
            start_time: '2026-09-13 08:15:00',
            show_in_monitor: true,
          },
        ],
      });

      expect(order?.mechanics).toEqual([
        {
          employeeCode: '7',
          name: 'João',
          // Normalised to ISO at the boundary, so no client parses SQL dates.
          startedAt: new Date('2026-09-13T08:15:00').toISOString(),
          showInMonitor: true,
        },
      ]);
    });

    /** Assigned but not started: a name with no running timer. */
    it('keeps a mechanic who has not clocked on', () => {
      const order = toMonitorServiceOrder({
        number: 1,
        mechanics: [{ employee_code: 7, name: 'João' }],
      });

      expect(order?.mechanics[0]).toMatchObject({ employeeCode: '7', startedAt: undefined });
    });

    /** Two anonymous entries would render as two rows nothing can tell apart. */
    it('drops an entry with no employee code', () => {
      const order = toMonitorServiceOrder({
        number: 1,
        mechanics: [{ name: 'sem código' }, { employee_code: 7 }],
      });

      expect(order?.mechanics).toHaveLength(1);
    });

    it('survives a malformed entry without losing the card', () => {
      const order = toMonitorServiceOrder({
        number: 1,
        mechanics: ['nonsense', null, { employee_code: 7 }],
      });

      expect(order?.mechanics).toHaveLength(1);
    });
  });

  describe('interventions', () => {
    it('reads the shape the tenant sends, defaulting completed to false', () => {
      const order = toMonitorServiceOrder({
        number: 1,
        interventions: [{ intervention: 'Mudança de óleo', completed: false }],
      });

      expect(order?.interventions).toEqual([
        {
          sequenceNumber: undefined,
          name: 'Mudança de óleo',
          completed: false,
          durationRaw: undefined,
        },
      ]);
    });

    /**
     * `duration` is published verbatim under a name that does not claim a unit.
     * The docs give the type and not the scale, and no record has ever carried
     * one, so calling it `durationMinutes` would be inventing a fact.
     */
    it('publishes duration verbatim, without claiming a unit', () => {
      const order = toMonitorServiceOrder({
        number: 1,
        interventions: [
          { sequence_number: 2, intervention: 'Travões', completed: true, duration: 90 },
        ],
      });

      expect(order?.interventions[0]).toEqual({
        sequenceNumber: 2,
        name: 'Travões',
        completed: true,
        durationRaw: 90,
      });
    });
  });

  /**
   * The two documentation pages disagree about the scale of this field, so the
   * mapper normalises rather than trusting either.
   */
  describe('completion percentage', () => {
    it('keeps a 0–1 fraction as it is', () => {
      expect(
        toMonitorServiceOrder({ number: 1, completion_percentage: 0.4 })?.completionPercentage,
      ).toBe(0.4);
    });

    it('converts a 0–100 percentage to the same fraction', () => {
      expect(
        toMonitorServiceOrder({ number: 1, completion_percentage: 40 })?.completionPercentage,
      ).toBe(0.4);
    });

    it('never publishes more than complete, or less than nothing', () => {
      expect(
        toMonitorServiceOrder({ number: 1, completion_percentage: 250 })?.completionPercentage,
      ).toBe(1);
      expect(
        toMonitorServiceOrder({ number: 1, completion_percentage: -5 })?.completionPercentage,
      ).toBeUndefined();
    });
  });
});
