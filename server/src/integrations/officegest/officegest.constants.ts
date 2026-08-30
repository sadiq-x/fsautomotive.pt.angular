/**
 * Everything about the OfficeGest wire contract that is a literal string.
 *
 * WHY ONE FILE
 * ------------
 * Parts of this contract are verified against OfficeGest's published
 * documentation and parts are not (see the markers below). When a tenant's
 * documentation says something different, the fix has to be a one-line edit in
 * a known place — not a search for a string literal spread across four
 * resources. Nothing outside this folder should ever contain an OfficeGest
 * path.
 *
 * CONTRACT SOURCES
 * ----------------
 * - VERIFIED  — https://api.officegest.com/docs/officegest-api/v2 (and /v1)
 * - INVENTORY — the published v2 endpoint inventory (`endpoints-v2.txt`),
 *               consistent with the documentation but not part of it
 * - INFERRED  — a convention deduced from the response shape, NOT documented
 */

/* -------------------------------------------------------------------------- */
/* Authentication — VERIFIED                                                   */
/* -------------------------------------------------------------------------- */

/** `POST /auth/login` with `{ username, password }`. */
export const AUTH_LOGIN_PATH = '/auth/login';

/** `DELETE /auth/logout` — INVENTORY. Used on shutdown, failure ignored. */
export const AUTH_LOGOUT_PATH = '/auth/logout';

/**
 * Where the token sits in the login response.
 *
 * The v2 documentation shows `data.token`. Field implementations report
 * `data.access_token` in practice. Both are accepted, in this order, so the
 * integration works either way instead of failing on a documentation lag.
 */
export const AUTH_TOKEN_FIELDS = ['access_token', 'token'] as const;

/* -------------------------------------------------------------------------- */
/* Resource paths — INVENTORY (`/entities/customers` also VERIFIED)            */
/* -------------------------------------------------------------------------- */

export const OFFICEGEST_PATHS = {
  customers: '/entities/customers',
  customerById: (customer: string) => `/entities/customers/${encodeURIComponent(customer)}`,
  customerSearch: '/entities/customers/search',

  vehicles: '/workshop/vehicles',
  vehicleByPlate: (plate: string) => `/workshop/vehicles/${encodeURIComponent(plate)}`,

  serviceOrders: '/workshop/service-orders',
  serviceOrderById: (serviceOrder: string) =>
    `/workshop/service-orders/${encodeURIComponent(serviceOrder)}`,

  appointments: '/crm/appointments',
  appointmentById: (id: string) => `/crm/appointments/${encodeURIComponent(id)}`,
} as const;

/* -------------------------------------------------------------------------- */
/* Query parameters — INFERRED. CONFIRM BEFORE PRODUCTION.                     */
/* -------------------------------------------------------------------------- */

/**
 * ⚠️ INFERRED, NOT DOCUMENTED.
 *
 * The documented response envelope (`meta.current_page`, `meta.total`) is the
 * shape a Laravel paginator emits, and that paginator reads `page` and
 * `per_page`. That makes these the well-founded default — but they are a
 * deduction, not a published contract.
 *
 * Verify against your tenant's documentation. If they differ, change them here
 * and nowhere else: every list endpoint in this service reads these names.
 */
export const PAGINATION_PARAMS = {
  page: 'page',
  perPage: 'per_page',
} as const;

/**
 * ⚠️ INFERRED, NOT DOCUMENTED. The free-text filter accepted by list endpoints.
 * Same caveat as `PAGINATION_PARAMS`.
 */
export const SEARCH_PARAM = 'search';

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

/** Backoff before retry n (1-based), in ms, before jitter is applied. */
export const RETRY_BASE_DELAY_MS = 300;

/** Never wait longer than this between attempts, whatever `Retry-After` says. */
export const MAX_RETRY_DELAY_MS = 5_000;

/** Only these methods are retried automatically — see `officegest.client.ts`. */
export const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
