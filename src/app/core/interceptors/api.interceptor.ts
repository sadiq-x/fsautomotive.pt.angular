/**
 * Turns an application-relative path into a real request against the backend.
 *
 * WHY AN INTERCEPTOR AND NOT A BASE URL IN THE SERVICE
 * ----------------------------------------------------
 * Services then describe *what* they want (`/api/officegest/customers`) and
 * nothing about *where* it lives. Moving the backend to another origin, or
 * putting it behind a path prefix, becomes one environment variable rather than
 * an edit in every service — and tests can assert on the readable path.
 *
 * It also attaches `withCredentials`, which the session cookie needs on any
 * cross-origin call. Doing that here means no request can forget it.
 */
import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';

import { API_BASE_URL } from '../config/api.config';

/**
 * Marks a request whose 401 is an expected answer rather than a session
 * expiry — the start-up session probe. Without it, that probe would trigger the
 * "you have been signed out" redirect on every visit by an anonymous user.
 */
export const EXPECTS_UNAUTHORIZED = new HttpContextToken<boolean>(() => false);

/** Requests to our own backend start with this; anything else is left alone. */
const APP_API_PREFIX = '/api/';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(APP_API_PREFIX)) {
    // An absolute URL, or an asset. Not ours to rewrite.
    return next(request);
  }

  const baseUrl = inject(API_BASE_URL);

  return next(
    request.clone({
      url: `${baseUrl}${request.url}`,
      // The session lives in an HttpOnly cookie, which the browser only sends
      // cross-origin when asked.
      withCredentials: true,
    }),
  );
};
