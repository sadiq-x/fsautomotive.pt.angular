/**
 * Reading OfficeGest's timestamps.
 *
 * Upstream writes Lisbon wall-clock time with no offset. These pin that the
 * reading no longer depends on the server's own timezone — the suite is run
 * under both `TZ=UTC` and `TZ=Europe/Lisbon` to prove it.
 */
import { describe, expect, it } from 'vitest';

import { readIsoDate } from './officegest.record-readers.js';

const read = (value: unknown) => readIsoDate({ at: value }, ['at']);

describe('readIsoDate', () => {
  it('reads a summer wall-clock time as Lisbon (UTC+1)', () => {
    expect(read('2026-09-16 16:19:00')).toBe('2026-09-16T15:19:00.000Z');
  });

  it('reads a winter wall-clock time as Lisbon (UTC+0)', () => {
    expect(read('2026-01-15 09:00:00')).toBe('2026-01-15T09:00:00.000Z');
  });

  it('follows the spring-forward changeover (29 Mar 2026, 01:00 → 02:00)', () => {
    expect(read('2026-03-29 00:30:00')).toBe('2026-03-29T00:30:00.000Z');
    expect(read('2026-03-29 03:00:00')).toBe('2026-03-29T02:00:00.000Z');
  });

  it('follows the fall-back changeover (25 Oct 2026, 02:00 → 01:00)', () => {
    expect(read('2026-10-24 12:00:00')).toBe('2026-10-24T11:00:00.000Z');
    expect(read('2026-10-26 12:00:00')).toBe('2026-10-26T12:00:00.000Z');
  });

  it('accepts the T separator, a missing seconds field, and fractional seconds', () => {
    expect(read('2026-09-16T16:19:00')).toBe('2026-09-16T15:19:00.000Z');
    expect(read('2026-09-16 16:19')).toBe('2026-09-16T15:19:00.000Z');
    expect(read('2026-09-16 16:19:00.500')).toBe('2026-09-16T15:19:00.000Z');
  });

  it('leaves a timestamp with its own offset exactly as written', () => {
    expect(read('2026-09-16T16:19:00Z')).toBe('2026-09-16T16:19:00.000Z');
    expect(read('2026-09-16T16:19:00+02:00')).toBe('2026-09-16T14:19:00.000Z');
  });

  it('leaves a date with no time as before — UTC midnight', () => {
    expect(read('2026-09-16')).toBe('2026-09-16T00:00:00.000Z');
  });

  it('rejects an impossible date rather than rolling it over', () => {
    expect(read('2026-13-40 10:00:00')).toBeUndefined();
    expect(read('2026-02-30 10:00:00')).toBeUndefined();
    expect(read('2026-09-16 25:00:00')).toBeUndefined();
  });

  it('is undefined for anything that is not a date', () => {
    expect(read('not a date')).toBeUndefined();
    expect(read(undefined)).toBeUndefined();
    expect(read({})).toBeUndefined();
  });
});
