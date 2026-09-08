import { describe, expect, it } from 'vitest';

import { grants, grantsAny, PERMISSIONS, toSessionUser, type AuthUser } from './auth.model.js';

/**
 * These mirror `src/app/core/auth/auth.service.spec.ts` in the Angular
 * application, deliberately. The two implementations of the umbrella rule are
 * separate code — one decides which links to render, the other which data
 * leaves the building — and the failure they exist to prevent is the two
 * quietly disagreeing: a page the browser offers and the backend refuses, or,
 * far worse, the other way round.
 */
describe('grants', () => {
  it('accepts a permission that was granted outright', () => {
    expect(grants(['officegest.appointments.write'], 'officegest.appointments.write')).toBe(true);
  });

  it('treats officegest.read as covering every OfficeGest read', () => {
    expect(grants(['officegest.read'], 'officegest.customers.read')).toBe(true);
    expect(grants(['officegest.read'], 'officegest.vehicles.read')).toBe(true);
    expect(grants(['officegest.read'], 'officegest.service-orders.read')).toBe(true);
    expect(grants(['officegest.read'], 'officegest.appointments.read')).toBe(true);
  });

  it('does not let the umbrella read grant imply a write permission', () => {
    expect(grants(['officegest.read'], 'officegest.appointments.write')).toBe(false);
    expect(grants(['officegest.read'], 'officegest.write')).toBe(false);
  });

  /**
   * The umbrella is named after OfficeGest, so it opens OfficeGest. A grant
   * named after one system must not silently open another.
   */
  it('does not let the umbrella read grant reach outside its own namespace', () => {
    expect(grants(['officegest.read'], 'settings.read')).toBe(false);
    expect(grants(['officegest.read'], 'workers.read')).toBe(false);
  });

  it('refuses everything for an empty grant set', () => {
    expect(PERMISSIONS.every((permission) => !grants([], permission))).toBe(true);
  });
});

describe('grantsAny', () => {
  it('is satisfied by one of several requirements', () => {
    expect(grantsAny(['workers.read'], ['settings.read', 'workers.read'])).toBe(true);
  });

  it('requires nothing when nothing is required', () => {
    expect(grantsAny([], [])).toBe(true);
  });
});

describe('toSessionUser', () => {
  /**
   * The single place an account becomes something a response may contain. If a
   * field is ever added to `AuthUser` and forgotten here, this is what fails —
   * which is the point, because the field most likely to be added is another
   * secret.
   */
  it('drops the password hash and the disabled flag', () => {
    const user: AuthUser = {
      id: 'user-1',
      email: 'ana@fsautomotive.pt',
      name: 'Ana Silva',
      role: 'ADMIN',
      permissions: ['officegest.read'],
      passwordHash: 'scrypt$1024$8$1$c2FsdHNhbHRzYWx0$aGFzaGhhc2hoYXNoaGFzaA==',
      disabled: false,
    };

    expect(toSessionUser(user)).toEqual({
      id: 'user-1',
      email: 'ana@fsautomotive.pt',
      name: 'Ana Silva',
      role: 'ADMIN',
      permissions: ['officegest.read'],
    });
  });
});
