/**
 * Session state, against a stubbed gateway.
 *
 * The gateway is stubbed rather than HTTP, because the service's contract is
 * with the gateway — that seam is exactly what the port exists for.
 */
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiError } from '../models/api.model';
import { AuthGateway } from './auth.gateway';
import type { SessionUser } from './auth.models';
import { AuthService } from './auth.service';

const USER: SessionUser = {
  id: '1',
  name: 'Miguel Faria',
  email: 'miguel@fsautomotive.pt',
  role: 'ADMIN',
  permissions: ['officegest.read', 'officegest.appointments.write'],
};

function configure(gateway: Partial<AuthGateway>): AuthService {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AuthGateway,
        useValue: {
          login: () => of(USER),
          session: () => of(null),
          logout: () => of(undefined),
          ...gateway,
        },
      },
    ],
  });

  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  it('starts in the unknown state, before the backend has been asked', () => {
    const auth = configure({});

    expect(auth.status()).toBe('unknown');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('becomes authenticated when the cookie names a valid session', async () => {
    const auth = configure({ session: () => of(USER) });

    await auth.restore();

    expect(auth.status()).toBe('authenticated');
    expect(auth.user()).toEqual(USER);
  });

  it('becomes anonymous when there is no session', async () => {
    const auth = configure({ session: () => of(null) });

    await auth.restore();

    expect(auth.status()).toBe('anonymous');
  });

  // Leaving the status at `unknown` would hang every guard for ever, so a
  // backend that is simply down must still resolve to a decision.
  it('becomes anonymous when the session request fails outright', async () => {
    const auth = configure({
      session: () => throwError(() => new ApiError(0, 'HTTP_0', 'offline')),
    });

    await auth.restore();

    expect(auth.status()).toBe('anonymous');
  });

  it('asks the backend once even when several guards restore concurrently', async () => {
    let calls = 0;
    const auth = configure({
      session: () => {
        calls++;
        return of(USER);
      },
    });

    await Promise.all([auth.restore(), auth.restore(), auth.restore()]);

    expect(calls).toBe(1);
  });

  it('does not ask again once the status is known', async () => {
    let calls = 0;
    const auth = configure({
      session: () => {
        calls++;
        return of(USER);
      },
    });

    await auth.restore();
    await auth.restore();

    expect(calls).toBe(1);
  });

  it('signs in and exposes the user', async () => {
    const auth = configure({ login: () => of(USER) });

    await auth.login({ email: 'a@b.pt', password: 'x' });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.initials()).toBe('MF');
  });

  it('propagates a rejected sign-in and stays anonymous', async () => {
    const auth = configure({
      login: () => throwError(() => new ApiError(401, 'INVALID_CREDENTIALS', 'nope')),
    });

    await expect(auth.login({ email: 'a@b.pt', password: 'x' })).rejects.toBeInstanceOf(ApiError);
    expect(auth.isAuthenticated()).toBe(false);
  });

  // A user on a shared machine who clicked "sign out" must end up signed out,
  // even if the request to say so did not get through.
  it('clears the session even when the logout request fails', async () => {
    const auth = configure({
      login: () => of(USER),
      logout: () => throwError(() => new ApiError(500, 'HTTP_500', 'boom')),
    });

    await auth.login({ email: 'a@b.pt', password: 'x' });
    await auth.logout();

    expect(auth.status()).toBe('anonymous');
    expect(auth.user()).toBeNull();
  });

  describe('permissions', () => {
    it('grants a permission that was issued explicitly', async () => {
      const auth = configure({ session: () => of(USER) });
      await auth.restore();

      expect(auth.hasPermission('officegest.appointments.write')).toBe(true);
    });

    // `officegest.read` is the umbrella grant, so a simple deployment can issue
    // one permission instead of five.
    it('treats officegest.read as covering every read permission', async () => {
      const auth = configure({ session: () => of(USER) });
      await auth.restore();

      expect(auth.hasPermission('officegest.customers.read')).toBe(true);
      expect(auth.hasPermission('officegest.vehicles.read')).toBe(true);
    });

    it('does not let the umbrella read grant imply a write permission', async () => {
      const auth = configure({
        session: () => of({ ...USER, permissions: ['officegest.read'] as const }),
      });
      await auth.restore();

      expect(auth.hasPermission('officegest.appointments.write')).toBe(false);
    });

    // The umbrella is named after OfficeGest, so it grants OfficeGest reads and
    // nothing else. `settings.read` guards an admin screen and `workers.read` a
    // list the ERP knows nothing about; a data grant must not open either.
    it('does not let the umbrella read grant reach outside its own namespace', async () => {
      const auth = configure({
        session: () => of({ ...USER, permissions: ['officegest.read'] as const }),
      });
      await auth.restore();

      expect(auth.hasPermission('settings.read')).toBe(false);
      expect(auth.hasPermission('workers.read')).toBe(false);
    });

    it('grants a non-OfficeGest permission that was issued explicitly', async () => {
      const auth = configure({
        session: () => of({ ...USER, permissions: ['settings.read'] as const }),
      });
      await auth.restore();

      expect(auth.hasPermission('settings.read')).toBe(true);
      expect(auth.hasPermission('workers.read')).toBe(false);
    });

    it('denies everything while anonymous', () => {
      const auth = configure({});

      expect(auth.hasPermission('officegest.read')).toBe(false);
    });
  });
});
