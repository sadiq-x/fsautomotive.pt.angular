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
/* Resource paths — EXISTENCE VERIFIED against the tenant, 2026-09-06          */
/* -------------------------------------------------------------------------- */

/**
 * Every collection path below was probed against the live tenant and answered
 * **403**, while wrong paths — `/customers`, `/workshop/jobs`, `/sales/invoices`
 * and a nonsense control — answered **404**. The API distinguishes the two, so a
 * 403 is positive evidence that the route exists and that only the API user's
 * permissions stand between this service and the data.
 *
 * What that does **not** establish is the response *shape*: no request has ever
 * returned 200, so the field names the mappers read are still inferred. See
 * `officegest.record-readers.ts`, and run `npm run probe -- <path>` once the
 * permissions are granted.
 *
 * Also confirmed to exist, though unused here: `/entities/suppliers`,
 * `/entities/employees`, `/workshop/interventions`, `/sales/documents`.
 */

export const OFFICEGEST_PATHS = {
  customers: '/entities/customers',
  customerById: (customer: string) => `/entities/customers/${encodeURIComponent(customer)}`,
  customerSearch: '/entities/customers/search',

  vehicles: '/workshop/vehicles',
  vehicleByPlate: (plate: string) => `/workshop/vehicles/${encodeURIComponent(plate)}`,

  serviceOrders: '/workshop/service-orders',
  serviceOrderById: (serviceOrder: string) =>
    `/workshop/service-orders/${encodeURIComponent(serviceOrder)}`,

  employees: '/entities/employees',

  appointments: '/crm/appointments',
  appointmentById: (id: string) => `/crm/appointments/${encodeURIComponent(id)}`,
} as const;

/* -------------------------------------------------------------------------- */
/* Query parameters — INFERRED. CONFIRM BEFORE PRODUCTION.                     */
/* -------------------------------------------------------------------------- */

/**
 * CONFIRMED against the tenant on 2026-09-07, and the deduction was wrong.
 *
 * The envelope looks like a Laravel paginator, so `per_page` was inferred. The
 * API **silently ignores it**: every request came back with exactly 15 rows and
 * `meta.per_page: 15` whatever was asked for, so the page-size control changed
 * the label and nothing else. The parameter it actually reads is `limit`.
 *
 * `page` was right — pages 1 and 2 return disjoint records.
 */
export const PAGINATION_PARAMS = {
  page: 'page',
  perPage: 'limit',
} as const;

/**
 * The largest `limit` the API honours. Asking for 500 or 1000 returns 250.
 *
 * Only the count sweep uses this; ordinary requests are bounded far lower by
 * `MAX_PER_PAGE` in `shared/http/pagination.ts`.
 */
export const MAX_UPSTREAM_LIMIT = 250;

/**
 * The filter parameters each list endpoint accepts. CONFIRMED 2026-09-07.
 *
 * There is no shared free-text `search`: the codebase inferred one, and — like
 * `per_page` — the API ignores it silently, answering 200 with an unfiltered
 * first page. That is why the search boxes appeared to do nothing.
 *
 * The two resources also differ in kind, which the callers have to respect:
 *
 *  - **Customers and employees** take `name`, and it is a *partial* match: a
 *    prefix or a substring both narrow the list.
 *  - **Vehicles** take `plate`, `vin` and `description`, and every one of them
 *    is an *exact* match. A plate must carry its hyphens — `00-00-ZZ` finds the
 *    car, `0000ZZ` finds nothing — which matters because this codebase stores
 *    plates normalised without them.
 *
 * `filter` exists too and answers 422 to a bare string; it wants a structure
 * nothing here needs. Left alone deliberately.
 */
export const FILTER_PARAMS = {
  /** Partial match. Customers and employees. */
  name: 'name',
  /** Exact. */
  taxId: 'tax_id',
  /** Exact. */
  email: 'email',
  /** Exact, hyphenated. */
  plate: 'plate',
  /** Exact. */
  vin: 'vin',
  /** Exact — the whole description, so it is a poor free-text target. */
  description: 'description',
} as const;

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

/** Backoff before retry n (1-based), in ms, before jitter is applied. */
export const RETRY_BASE_DELAY_MS = 300;

/** Never wait longer than this between attempts, whatever `Retry-After` says. */
export const MAX_RETRY_DELAY_MS = 5_000;

/** Only these methods are retried automatically — see `officegest.client.ts`. */
export const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
