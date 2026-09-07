/**
 * How one search box becomes an upstream filter.
 *
 * WHY THESE MATTER
 * ----------------
 * OfficeGest has no free-text search. The codebase inferred a `search`
 * parameter, the API ignored it silently and answered 200 with an unfiltered
 * page — so both search boxes looked broken while every log line said success.
 * These pin the replacement, including the two details that are easy to lose:
 * a NIF is not a name, and a plate only matches upstream with its hyphens.
 */
import { describe, expect, it } from 'vitest';

import { toCustomerFilter } from './customers/customers.service.js';
import { toVehicleFilter } from './vehicles/vehicles.service.js';

describe('toCustomerFilter', () => {
  it('treats an ordinary term as a partial name match', () => {
    expect(toCustomerFilter('silva')).toEqual({ name: 'silva' });
  });

  // Nine digits is a NIF, and `name` would match none of them.
  it('routes a tax number to the tax-number filter', () => {
    expect(toCustomerFilter('500038872')).toEqual({ taxId: '500038872' });
  });

  it('routes anything containing an @ to the e-mail filter', () => {
    expect(toCustomerFilter('sng.sergio@gmail.com')).toEqual({ email: 'sng.sergio@gmail.com' });
  });

  it('does not mistake a number of the wrong length for a tax number', () => {
    expect(toCustomerFilter('12345')).toEqual({ name: '12345' });
    expect(toCustomerFilter('1234567890')).toEqual({ name: '1234567890' });
  });

  it('sends nothing for an empty or blank box', () => {
    expect(toCustomerFilter(undefined)).toEqual({});
    expect(toCustomerFilter('   ')).toEqual({});
  });

  it('trims, so a stray space does not become part of the term', () => {
    expect(toCustomerFilter('  silva  ')).toEqual({ name: 'silva' });
  });
});

describe('toVehicleFilter', () => {
  /**
   * The detail that made a correctly-typed plate return nothing: this codebase
   * normalises plates to `AA00BB`, and upstream matches only `AA-00-BB`.
   */
  it('hyphenates a plate, however the user typed it', () => {
    expect(toVehicleFilter('00-00-ZZ')).toEqual({ plate: '00-00-ZZ' });
    expect(toVehicleFilter('0000ZZ')).toEqual({ plate: '00-00-ZZ' });
    expect(toVehicleFilter('00 00 zz')).toEqual({ plate: '00-00-ZZ' });
    expect(toVehicleFilter('  aa-00-bb ')).toEqual({ plate: 'AA-00-BB' });
  });

  it('routes a chassis number to the VIN filter', () => {
    expect(toVehicleFilter('VF1000000000000')).toEqual({ vin: 'VF1000000000000' });
  });

  // Exact upstream, so it rarely matches — but dropping the term would show an
  // unfiltered list, which claims the search ran and found everything.
  it('falls back to the description rather than dropping the term', () => {
    expect(toVehicleFilter('Ferrari')).toEqual({ description: 'Ferrari' });
  });

  it('sends nothing for an empty or blank box', () => {
    expect(toVehicleFilter(undefined)).toEqual({});
    expect(toVehicleFilter('  ')).toEqual({});
  });
});
