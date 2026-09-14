/**
 * A test double for the auth port.
 *
 * WHY THIS EXISTS
 * ---------------
 * `AuthService` is `providedIn: 'root'` and depends on `AuthGateway`, which
 * only `provideAuth()` supplies. Any test that reaches the real `AuthService` —
 * directly, or through a service that asks who is signed in — therefore needs a
 * gateway, and without one fails with a bare `NG0201` naming a class the test
 * never mentioned.
 *
 * It lives beside the port rather than in a spec so that the several suites
 * needing it share one double instead of each inventing a slightly different
 * one. It is imported only by `.spec.ts` files, so nothing reaches the bundle.
 */
import type { Provider } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { AuthGateway } from './auth.gateway';
import type { Credentials, SessionUser } from './auth.models';

/**
 * An in-memory gateway whose answers a test sets directly.
 *
 * `nextUser` is who the *next* `login()` or `session()` resolves to, which is
 * what lets one test sign two different accounts into the same tab — the case
 * that matters for anything cached across a session.
 */
export class StubAuthGateway extends AuthGateway {
  nextUser: SessionUser | null = null;

  override login(_credentials: Credentials): Observable<SessionUser> {
    return this.nextUser
      ? of(this.nextUser)
      : throwError(() => new Error('StubAuthGateway: set nextUser before calling login()'));
  }

  override session(): Observable<SessionUser | null> {
    return of(this.nextUser);
  }

  override logout(): Observable<void> {
    this.nextUser = null;
    return of(undefined);
  }
}

/** Providers that satisfy `AuthService` in a test. */
export function provideAuthStub(): Provider[] {
  return [{ provide: AuthGateway, useClass: StubAuthGateway }];
}
