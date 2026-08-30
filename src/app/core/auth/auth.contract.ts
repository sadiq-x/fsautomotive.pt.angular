/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  THE ONLY UNVERIFIED CONTRACT IN THIS APPLICATION                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * The endpoints below **do not exist yet**. The backend in `server/` brokers
 * OfficeGest data but has no user authentication: its only guard is a static
 * `x-api-key`, which a browser cannot hold, because everything in the bundle is
 * public.
 *
 * So this file states what the Angular side expects, in one place, instead of
 * scattering assumptions through a service. Point it at your identity provider
 * — or implement these three endpoints in `server/` — and nothing else in the
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
 * REQUIRED ENDPOINTS
 * ------------------
 * `POST /api/auth/login`
 *   body     `{ "email": string, "password": string }`
 *   200      `{ "success": true, "data": <SessionUser> }` + Set-Cookie
 *   401      `{ "success": false, "error": { "code": "INVALID_CREDENTIALS", … } }`
 *
 * `GET /api/auth/session`
 *   200      `{ "success": true, "data": <SessionUser> }`
 *   401      no valid session — the app treats this as "anonymous", not an error
 *
 * `POST /api/auth/logout`
 *   204      cookie cleared
 *
 * `SessionUser` is defined in `auth.models.ts`.
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
