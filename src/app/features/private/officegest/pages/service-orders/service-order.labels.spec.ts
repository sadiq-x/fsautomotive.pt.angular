/**
 * Work-order status codes → names.
 *
 * The cases worth pinning are the boundary this file draws: a code with a
 * name confirmed from OfficeGest's own status tabs renders that name, and a
 * code with no such confirmation — `MAR` — renders as itself rather than a
 * guessed Portuguese label.
 */
import { describe, expect, it } from 'vitest';

import {
  computeBilledTotal,
  formatServiceOrderStatus,
  SERVICE_ORDER_STATUS_CODES,
  SERVICE_ORDER_STATUS_OPTIONS,
  SERVICE_ORDER_STATUSES,
} from './service-order.labels';

describe('computeBilledTotal', () => {
  it('adds up the gross of every line', () => {
    expect(computeBilledTotal([{ total: 6.03 }, { total: 403.51 }])).toBeCloseTo(409.54, 2);
  });

  it('skips a line with no total rather than counting it as zero', () => {
    expect(computeBilledTotal([{ total: 10 }, {}])).toBe(10);
  });

  it('is undefined for no lines, not zero', () => {
    expect(computeBilledTotal([])).toBeUndefined();
    expect(computeBilledTotal(undefined)).toBeUndefined();
  });

  it('is undefined when no line carries a total at all', () => {
    expect(computeBilledTotal([{}, {}])).toBeUndefined();
  });
});

describe('formatServiceOrderStatus', () => {
  it("prefers the record's own statusName when it is genuinely readable", () => {
    expect(formatServiceOrderStatus('FAC', 'Um nome qualquer')).toBe('Um nome qualquer');
  });

  it.each([
    ['FAC', 'Faturado'],
    ['F', 'Fechado'],
    ['ENT', 'Entregue'],
    ['ANU', 'Anulado'],
    ['ESP', 'Em espera'],
    ['TCP', 'Trabalhos Complexos'],
    ['VIT', 'Viaturas Internas'],
    ['COL', 'Colisão'],
    ['SEG', 'Seguradoras'],
    ['EXE', 'Em Execução'],
  ])('falls back to the confirmed name for %s', (code, name) => {
    expect(formatServiceOrderStatus(code)).toBe(name);
  });

  it('matches case-insensitively, the way upstream codes are not guaranteed to arrive', () => {
    expect(formatServiceOrderStatus('esp')).toBe('Em espera');
  });

  /** No screenshot or record has ever shown a name for it — showing one would be a guess. */
  it('falls back to the bare code for MAR, which has no confirmed name', () => {
    expect(formatServiceOrderStatus('MAR')).toBe('MAR');
  });

  it('falls back to the bare code for a status nobody has ever confirmed', () => {
    expect(formatServiceOrderStatus('ZZZ')).toBe('ZZZ');
  });

  it('is null for a job with no status at all, rather than an empty string', () => {
    expect(formatServiceOrderStatus(undefined)).toBeNull();
  });
});

describe('SERVICE_ORDER_STATUSES', () => {
  it('gives every confirmed status a code, a name and a short name no longer than it', () => {
    for (const status of SERVICE_ORDER_STATUSES) {
      expect(status.code.length).toBeGreaterThan(0);
      expect(status.name.length).toBeGreaterThan(0);
      expect(status.shortName.length).toBeGreaterThan(0);
      expect(status.shortName.length).toBeLessThanOrEqual(status.name.length);
    }
  });
});

describe('SERVICE_ORDER_STATUS_CODES', () => {
  it('includes MAR even though it has no confirmed name', () => {
    expect(SERVICE_ORDER_STATUS_CODES).toContain('MAR');
  });
});

describe('SERVICE_ORDER_STATUS_OPTIONS', () => {
  it('labels a confirmed status with its code and name together', () => {
    const option = SERVICE_ORDER_STATUS_OPTIONS.find((entry) => entry.value === 'ESP');

    expect(option?.label).toBe('ESP — Em espera');
  });

  it('labels MAR with just its code', () => {
    const option = SERVICE_ORDER_STATUS_OPTIONS.find((entry) => entry.value === 'MAR');

    expect(option?.label).toBe('MAR');
  });
});
