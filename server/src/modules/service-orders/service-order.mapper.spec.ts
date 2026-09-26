/**
 * Mapping a service-order record.
 *
 * The estimated-minutes cases pin a real regression: order 202600642's five
 * interventions carry a real, non-zero `estimated_time` summing to 480
 * minutes, and the mapper was not reading them at all — the page fell back to
 * a name-matched catalogue join that only found 33 of those 480.
 */
import { describe, expect, it } from 'vitest';

import { toServiceOrder } from './service-order.mapper.js';

describe('toServiceOrder', () => {
  it('sums estimated_time across every intervention on the order', () => {
    const order = toServiceOrder({
      number: 202600642,
      interventions: [
        { line_number: 1, id: 202600001, estimated_time: 120 },
        { line_number: 2, id: 202600002, estimated_time: 60 },
        { line_number: 3, id: 202600003, estimated_time: 90 },
        { line_number: 4, id: 202600004, estimated_time: 150 },
        { line_number: 5, id: 202600005, estimated_time: 60 },
      ],
    });

    expect(order?.estimatedMinutes).toBe(480);
  });

  it('excludes a zero entry rather than counting it as no time booked', () => {
    const order = toServiceOrder({
      number: 1,
      interventions: [
        { line_number: 1, id: 1, estimated_time: 30 },
        { line_number: 2, id: 2, estimated_time: 0 },
      ],
    });

    expect(order?.estimatedMinutes).toBe(30);
  });

  it('is undefined, not zero, when every intervention has no time booked', () => {
    const order = toServiceOrder({
      number: 1,
      interventions: [{ line_number: 1, id: 1, estimated_time: 0 }],
    });

    expect(order?.estimatedMinutes).toBeUndefined();
  });

  it('is undefined when the order carries no interventions at all', () => {
    const order = toServiceOrder({ number: 1 });

    expect(order?.estimatedMinutes).toBeUndefined();
  });

  it('does not fail on a malformed interventions array', () => {
    const order = toServiceOrder({ number: 1, interventions: ['not an object', null, 42] });

    expect(order?.estimatedMinutes).toBeUndefined();
  });

  describe('interventionMinutes', () => {
    /** The real shape of order 202600642: the id is the order number, repeated. */
    it('keeps each line’s own time, in line_number order', () => {
      const order = toServiceOrder({
        number: 202600642,
        interventions: [
          { line_number: 1, id: 202600642, estimated_time: 60 },
          { line_number: 2, id: 202600642, estimated_time: 30 },
          { line_number: 3, id: 202600642, estimated_time: 30 },
          { line_number: 4, id: 202600642, estimated_time: 30 },
          { line_number: 5, id: 202600642, estimated_time: 330 },
        ],
      });

      expect(order?.interventionMinutes).toEqual([60, 30, 30, 30, 330]);
      expect(order?.estimatedMinutes).toBe(480);
    });

    /** Pairing with the monitor's named list is by position, so order is the contract. */
    it('sorts by line_number even when upstream sends them out of order', () => {
      const order = toServiceOrder({
        number: 1,
        interventions: [
          { line_number: 2, estimated_time: 30 },
          { line_number: 1, estimated_time: 60 },
        ],
      });

      expect(order?.interventionMinutes).toEqual([60, 30]);
    });

    it('marks an untimed line null rather than zero, keeping its position', () => {
      const order = toServiceOrder({
        number: 1,
        interventions: [
          { line_number: 1, estimated_time: 0 },
          { line_number: 2, estimated_time: 45 },
        ],
      });

      expect(order?.interventionMinutes).toEqual([null, 45]);
      expect(order?.estimatedMinutes).toBe(45);
    });

    it('is undefined on a record with no interventions array, such as a list row', () => {
      expect(toServiceOrder({ number: 1 })?.interventionMinutes).toBeUndefined();
    });
  });
});
