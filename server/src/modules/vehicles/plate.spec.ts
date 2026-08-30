/** Plate normalisation — pure rules, so they are pinned exactly. */
import { describe, expect, it } from 'vitest';

import { formatPlate, isPlausiblePlate, normalisePlate } from './plate.js';

describe('normalisePlate', () => {
  it.each([
    ['AA-00-BB', 'AA00BB'],
    ['aa00bb', 'AA00BB'],
    ['aa 00 bb', 'AA00BB'],
    [' AA.00.BB ', 'AA00BB'],
  ])('reduces %s to its canonical form', (input, expected) => {
    expect(normalisePlate(input.trim())).toBe(expected);
  });
});

describe('isPlausiblePlate', () => {
  it('accepts six alphanumerics', () => {
    expect(isPlausiblePlate('AA00BB')).toBe(true);
    expect(isPlausiblePlate('1234AB')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isPlausiblePlate('AA00B')).toBe(false);
    expect(isPlausiblePlate('AA00BBB')).toBe(false);
    expect(isPlausiblePlate('AA-00-BB')).toBe(false);
  });
});

describe('formatPlate', () => {
  it('groups a valid plate for display', () => {
    expect(formatPlate('AA00BB')).toBe('AA-00-BB');
  });

  it('leaves an unrecognised value untouched rather than mangling it', () => {
    expect(formatPlate('FOREIGN123')).toBe('FOREIGN123');
  });
});
