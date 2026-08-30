/**
 * A development-only stand-in for the authentication backend.
 *
 * ⚠️ ACCEPTS ANY CREDENTIALS. It exists so the private area can be built and
 * reviewed before the endpoints in `auth.contract.ts` are implemented, and it
 * is gated twice so it cannot ship — see `core/config/auth.config.ts` for how,
 * and why once is not enough.
 *
 * It is deliberately not a mock library: behaving like the real gateway
 * (asynchronous, restoring a session across a refresh, able to fail on demand)
 * is what makes the loading and error states real enough to build against.
 */
import { Injectable, isDevMode } from '@angular/core';
import { delay, of, throwError, type Observable } from 'rxjs';

import { ApiError } from '../models/api.model';
import { AUTH_ERROR_CODES } from './auth.contract';
import { AuthGateway } from './auth.gateway';
import type { Credentials, SessionUser } from './auth.models';

/** Survives a page refresh, so the stub feels like a real session. */
const STUB_SESSION_KEY = 'fsautomotive:dev-session';

/** Round-trip delay, so loading states are visible rather than instantaneous. */
const STUB_LATENCY_MS = 350;

/**
 * Sign in with this password to exercise the failure path.
 * Any other password is accepted.
 */
export const STUB_REJECTED_PASSWORD = 'wrong';

const STUB_USER: SessionUser = {
  id: 'dev-1',
  name: 'Miguel Faria',
  email: 'miguel@fsautomotive.pt',
  role: 'ADMIN',
  permissions: [
    'officegest.read',
    'officegest.write',
    'officegest.customers.read',
    'officegest.vehicles.read',
    'officegest.service-orders.read',
    'officegest.appointments.read',
    'officegest.appointments.write',
  ],
};

@Injectable()
export class DevAuthGateway extends AuthGateway {
  constructor() {
    super();

    // Belt and braces: the provider already refuses to build this outside
    // development, but a future refactor could route around that.
    if (!isDevMode()) {
      throw new Error('DevAuthGateway must never be constructed outside development.');
    }
  }

  override login(credentials: Credentials): Observable<SessionUser> {
    if (credentials.password === STUB_REJECTED_PASSWORD) {
      return throwError(
        () =>
          new ApiError(
            401,
            AUTH_ERROR_CODES.invalidCredentials,
            'E-mail ou palavra-passe incorretos.',
          ),
      ).pipe(delay(STUB_LATENCY_MS));
    }

    const user: SessionUser = { ...STUB_USER, email: credentials.email };
    this.remember(user);

    return of(user).pipe(delay(STUB_LATENCY_MS));
  }

  override session(): Observable<SessionUser | null> {
    return of(this.recall()).pipe(delay(STUB_LATENCY_MS));
  }

  override logout(): Observable<void> {
    this.forget();
    return of(undefined).pipe(delay(STUB_LATENCY_MS));
  }

  private remember(user: SessionUser): void {
    try {
      sessionStorage.setItem(STUB_SESSION_KEY, JSON.stringify(user));
    } catch {
      // Private browsing, or storage disabled. The session simply will not
      // survive a refresh, which is acceptable for a stub.
    }
  }

  private recall(): SessionUser | null {
    try {
      const raw = sessionStorage.getItem(STUB_SESSION_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }

  private forget(): void {
    try {
      sessionStorage.removeItem(STUB_SESSION_KEY);
    } catch {
      /* nothing to clear */
    }
  }
}
