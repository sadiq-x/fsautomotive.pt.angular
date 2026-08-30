/**
 * The seam between `AuthService` and whatever actually authenticates.
 *
 * WHY AN INTERFACE
 * ----------------
 * The real endpoints do not exist yet (see `auth.contract.ts`). Rather than
 * leave the private area unusable until they do, `AuthService` depends on this
 * narrow port and the application provides one of two adapters: the HTTP one
 * for real deployments, or the development stub. Neither the service, the
 * guards, the interceptors nor any page knows which is in play.
 *
 * It is also what makes the auth tests possible without an HTTP mock.
 */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { EXPECTS_UNAUTHORIZED } from '../interceptors/api.interceptor';
import type { ApiSuccess } from '../models/api.model';
import { AUTH_ROUTES } from './auth.contract';
import type { Credentials, SessionUser } from './auth.models';

export abstract class AuthGateway {
  /** Resolves with the user, or rejects with an `ApiError` (401 for bad credentials). */
  abstract login(credentials: Credentials): Observable<SessionUser>;
  /** Resolves with the user when a session cookie is valid; `null` when it is not. */
  abstract session(): Observable<SessionUser | null>;
  abstract logout(): Observable<void>;
}

/**
 * Talks to the endpoints in `auth.contract.ts`.
 *
 * `withCredentials` is set on every call: the session is a cookie the browser
 * holds and JavaScript cannot read, so it must be attached explicitly on
 * cross-origin requests.
 */
@Injectable()
export class HttpAuthGateway extends AuthGateway {
  private readonly http = inject(HttpClient);

  override login(credentials: Credentials): Observable<SessionUser> {
    return this.http
      .post<ApiSuccess<SessionUser>>(AUTH_ROUTES.login, credentials, { withCredentials: true })
      .pipe(map((response) => response.data));
  }

  override session(): Observable<SessionUser | null> {
    // A 401 here is the expected answer for a visitor who is not signed in, not
    // a failure. The context flag tells the error interceptor to leave it alone,
    // so an anonymous visitor is not "signed out" and redirected on arrival.
    return this.http
      .get<ApiSuccess<SessionUser>>(AUTH_ROUTES.session, {
        withCredentials: true,
        context: new HttpContext().set(EXPECTS_UNAUTHORIZED, true),
      })
      .pipe(map((response) => response.data));
  }

  override logout(): Observable<void> {
    return this.http
      .post<void>(AUTH_ROUTES.logout, null, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}
