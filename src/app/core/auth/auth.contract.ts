/**
 * The authentication contract, stated once.
 *
 * These three endpoints are implemented by the backend in `server/` — see
 * `server/src/modules/auth/`. This file is what the two sides agree on: the
 * Angular application knows no URL, no status code and no error code about
 * authentication that is not written here.
 *
 * ▶ TO TURN SIGN-IN ON: set `AUTH_USERS_FILE` (or `AUTH_USERS`) and
 *   `AUTH_SESSION_SECRET` in `server/.env`, and create an account with
 *   `npm --prefix server run hash:password`. Until they are set, the backend
 *   does not mount these routes at all and `/private/login` has nothing to talk
 *   to — use `DEV_AUTH_STUB=true` for front-end work without a backend.
 *
 * Pointing the application at a different identity provider instead means
 * writing one `AuthGateway` (see `auth.gateway.ts`); nothing else in the
 * private area has to change.
 *
 * WHAT THE FRONT END ASSUMES
 * --------------------------
 * 1. **A session cookie, not a token in JavaScript.** Every call is sent with
 *    `withCredentials: true`; the backend replies with an `HttpOnly`, `Secure`,
 *    `SameSite=Lax` cookie. Nothing is written to `localStorage`, so an XSS
 *    flaw cannot read the session — which it could if a JWT were stored there.
 *    This is why there is no token handling anywhere in this codebase.
 * 2. **The standard envelope.** Responses use the same
 *    `{ success, data }` / `{ success, error }` shape as the OfficeGest
 *    endpoints, so one HTTP client serves both.
 * 3. **The backend is the security boundary.** These endpoints decide what a
 *    user may do. The guards in `core/guards/` only steer navigation.
 *
 * THE ENDPOINTS
 * -------------
 * `POST /api/auth/login`
 *   body     `{ "email": string, "password": string }`
 *   200      `{ "success": true, "data": <SessionUser> }` + Set-Cookie
 *   401      `{ "success": false, "error": { "code": "INVALID_CREDENTIALS", … } }`
 *            — the same answer for an unknown address and a wrong password, so
 *            the form cannot be used to discover who has an account
 *   422      the body was malformed
 *   429      `ACCOUNT_LOCKED` — too many failed attempts, with `Retry-After`
 *
 * `GET /api/auth/session`
 *   200      `{ "success": true, "data": <SessionUser> }`
 *   401      no valid session — the app treats this as "anonymous", not an error
 *
 * `POST /api/auth/logout`
 *   204      cookie cleared, and the session destroyed server-side
 *
 * `SessionUser` is defined in `auth.models.ts`. Its `permissions` are the union
 * in that file, which `server/src/modules/auth/auth.model.ts` mirrors exactly —
 * if one changes, change both.
 */

export const AUTH_ROUTES = {
  login: '/api/auth/login',
  session: '/api/auth/session',
  logout: '/api/auth/logout',
} as const;

/** Backend `error.code` values the login form reacts to specifically. */
export const AUTH_ERROR_CODES = {
  invalidCredentials: 'INVALID_CREDENTIALS',
  accountLocked: 'ACCOUNT_LOCKED',
} as const;
