/**
 * Where the application's own backend lives.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  ▶ TO POINT THE APP AT A BACKEND: set `API_BASE_URL` in `.env`
 *
 *      API_BASE_URL=https://api.fsautomotive.pt
 *
 *    Leave it empty to call the same origin the site is served from, which is
 *    what a reverse-proxy deployment wants. Restart `npm start` afterwards:
 *    it is a build-time constant.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * THE ONLY BACKEND VALUE THIS APP MAY KNOW
 * ----------------------------------------
 * A URL is not a secret. The OfficeGest API key is, and it must never appear
 * here, in `.env`, or anywhere else the browser can reach: everything compiled
 * into the bundle is readable by every visitor. The key lives in `server/.env`
 * and never leaves that process — see `server/README.md`.
 *
 * The allow-list in `scripts/lib/env.mjs` is what enforces that: a variable not
 * named there cannot reach the bundle even if someone adds it to `.env`.
 */
import { InjectionToken } from '@angular/core';

/** Injected at build time by `scripts/ng-env.mjs`; declared, not imported. */
declare const NG_APP_API_BASE_URL: string | undefined;

/** The configured backend origin, or `''` for "same origin as this page". */
export const API_BASE_URL_VALUE: string =
  typeof NG_APP_API_BASE_URL === 'string' ? NG_APP_API_BASE_URL.trim().replace(/\/+$/, '') : '';

/**
 * The backend origin, behind a token so a test can supply its own without
 * touching the build environment.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => API_BASE_URL_VALUE,
});

/** Every backend path this application knows. Nothing else builds a URL. */
export const API_ROUTES = {
  officegest: {
    customers: '/api/officegest/customers',
    customer: (id: string) => `/api/officegest/customers/${encodeURIComponent(id)}`,
    vehicles: '/api/officegest/vehicles',
    vehicle: (plate: string) => `/api/officegest/vehicles/${encodeURIComponent(plate)}`,
    serviceOrders: '/api/officegest/service-orders',
    serviceOrder: (id: string) => `/api/officegest/service-orders/${encodeURIComponent(id)}`,
    appointments: '/api/officegest/appointments',
    appointment: (id: string) => `/api/officegest/appointments/${encodeURIComponent(id)}`,
  },
} as const;
