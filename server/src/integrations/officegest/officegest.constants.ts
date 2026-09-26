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
/* Timestamps — CONFIRMED against the tenant, 2026-09-26                       */
/* -------------------------------------------------------------------------- */

/**
 * The wall clock OfficeGest writes its timestamps in.
 *
 * Upstream sends `YYYY-MM-DD HH:mm:ss` with no offset, and `new Date()` reads
 * that in whatever timezone the *server* runs in: correct on a developer's
 * Lisbon machine, an hour late on a UTC host in summer. Pinning the zone here
 * makes the reading independent of where the backend is deployed.
 *
 * Why Lisbon and not UTC: on every `/times` entry checked, `created_at`
 * equals `start_time` to the second and `updated_at` equals `end_time` — one
 * clock stamps everything — and read as Lisbon that clock gives a working day
 * of 08:50–18:35 with a 13:00–14:40 lunch gap. It is also what OfficeGest's
 * own screens show the workshop.
 */
export const OFFICEGEST_TIME_ZONE = 'Europe/Lisbon';

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
 * The permissions have since been granted: every path below now answers 200,
 * and the field names the mappers read were re-probed against real payloads on
 * 2026-09-08 and 2026-09-13 rather than inferred. Use `npm run probe -- <path>`
 * to re-check one after an upstream change; it prints key names and types only,
 * never values.
 *
 * Also confirmed to exist: `/entities/suppliers` and `/sales/documents`
 * (unused), and `/workshop/interventions` — which is a *catalogue* of job types
 * carrying a standard `estimated_time`, not a record of work performed. The
 * data on work actually performed is on the monitor paths below.
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

  /**
   * `GET /workshop/service-orders/{serviceOrder}/times` — the actual clocked
   * time log for one order. CONFIRMED 2026-09-26 against the live tenant and
   * against `/docs/officegest-api/v2/workshop/service-orders/{serviceOrder}/
   * times/get`: a `ServiceOrderHourOutputDTO` per entry, carrying
   * `employee_id`, `employee_name`, `start_time`, `end_time` and
   * `difference_minutes` — a real clock-in *and* clock-out, with the mechanic's
   * name on the record itself.
   *
   * This is a different table from the monitor's `mechanics[]`: that one is
   * empty on every job on this tenant (nobody uses the live "OG Oficinas
   * Colaborador" clock-on), while this one is not — 7 real, fully closed
   * entries were found on the order this was probed against. Whatever process
   * populates it, it is the one genuinely reliable source of "who worked this
   * job, and for how long" this API has.
   */
  serviceOrderTimes: (serviceOrder: string) =>
    `/workshop/service-orders/${encodeURIComponent(serviceOrder)}/times`,

  employees: '/entities/employees',

  /**
   * The workshop's own reference tables. CONFIRMED 2026-09-08.
   *
   * A vehicle record carries `fuel_id`, `brand_id`, `model_id` and `version_id`
   * and no names to go with them, so without these every one of those fields is
   * an unusable number. Each table answers on the collection path and on
   * `/{id}`, which is what lets the small ones be cached whole and the large
   * ones read one row at a time.
   *
   * Sizes on this tenant: fuels 34, brands 65, models 7 750, versions unbounded
   * (cursor-paged). That difference is the whole reason `vehicle-catalogue.ts`
   * treats them in two ways rather than one.
   */
  fuels: '/workshop/fuels',
  brands: '/workshop/brands',
  versionById: (version: string) => `/workshop/versions/${encodeURIComponent(version)}`,

  /**
   * The live workshop board. CONFIRMED 2026-09-13, documented upstream at
   * `/docs/officegest-api/v2/workshop/monitor`.
   *
   * This is the only place in the API that publishes who is working on a car
   * *now*: a monitor row carries a `mechanics` array whose entries have an
   * `employee_code`, a `name` and a `start_time`. Nothing under
   * `/workshop/service-orders` carries any of that, which is why the board is
   * its own resource rather than a flag on the service-order one.
   *
   * The two differ in what they cover, and both are needed:
   *
   *  - `monitorServiceOrders` returns only the *active* states (ESP/EXE/MAR) —
   *    29 rows on this tenant against 1 200 — and adds `document_number`,
   *    `badge_color` and `budgets`. It is what the board reads.
   *  - `monitor` returns every job in every state, so it is the one to read for
   *    anything historical — including a single closed order's mechanic
   *    clock-on, once it has left the active board. See
   *    `WorkshopMonitorResource.getByNumber`.
   */
  workshopMonitor: '/workshop/monitor',
  monitorServiceOrders: '/workshop/monitor/service-orders',

  /**
   * The workshop's own mechanics — `id`, `name`, `department_id`. CONFIRMED
   * 2026-09-13; five records on this tenant.
   *
   * A monitor row already names its mechanics, so this is not needed to render
   * the board. It is the roster to reconcile `employee_code` against when a
   * name is missing, and it is deliberately not `/entities/employees`: that one
   * lists all twelve staff, including those who never touch a car.
   */
  mechanics: '/workshop/mechanics',

  /**
   * The workshop's departments — `id`, `name`, `responsible_id`. CONFIRMED
   * 2026-09-13; four records on this tenant.
   *
   * A mechanic carries a `department_id` and no name to go with it, exactly as
   * a vehicle carries `fuel_id`. Without this table the field is an unusable
   * number, which is the whole reason it is read.
   */
  departments: '/tables/departments',

  /**
   * The catalogue of job types — `id`, `description`, `estimated_time`,
   * `value_without_vat`. CONFIRMED 2026-09-13; 218 records on this tenant.
   *
   * This is a price list, not a record of work performed. It is read for one
   * thing: the standard time a job is expected to take, which is the only
   * estimate anywhere in this API.
   *
   * ⚠️ IT DOES NOT JOIN BY ID. A work order's nested `interventions` carry ids
   * in the 202400008–202400050 range — document references for that year's
   * sheets — while catalogue ids run 1–226. Zero of 85 order lines matched
   * that way. The join that *does* work by id is the monitor's intervention
   * **name** against this table's `description`: 23 of 23 matched exactly. See
   * `workshop-monitor.service.ts`.
   *
   * ⚠️ CORRECTED 2026-09-26: the order's own `estimated_time` was recorded here
   * as "0 on every one" on 2026-09-13, across 85 lines. That is no longer true
   * — order 202600642's 5 interventions all carry a real, non-zero
   * `estimated_time`, correctly read straight off the order record without
   * this catalogue at all. See `readEstimatedMinutes` in
   * `service-order.mapper.ts`. Whether the earlier probe was wrong or the
   * tenant has since started filling the field in, this catalogue join is no
   * longer the only source of a job's estimated time — it remains useful only
   * for naming an intervention shown on the live monitor board, which this
   * table's own record does not carry.
   */
  interventionCatalogue: '/workshop/interventions',

  appointments: '/crm/appointments',
  appointmentById: (id: string) => `/crm/appointments/${encodeURIComponent(id)}`,
} as const;

/* -------------------------------------------------------------------------- */
/* Workshop monitor — VERIFIED against the tenant and the docs, 2026-09-13     */
/* -------------------------------------------------------------------------- */

/**
 * The shop calendar the monitor computes `estimated_completion_date` against.
 *
 * Without these the API assumes 09:00–18:30 with lunch 13:00–14:30, which is
 * not this workshop's day. They are sent on every board request so the estimate
 * the screen shows is measured in the shop's own working hours rather than in
 * wall-clock time that includes nights and Sundays.
 *
 * Sent as documented names; `skip_weekends` takes 1/0 rather than true/false.
 */
export const MONITOR_SCHEDULE_PARAMS = {
  startHour: 'start_hour',
  endHour: 'end_hour',
  lunchStart: 'start_hour_lunch',
  lunchEnd: 'end_hour_lunch',
  skipWeekends: 'skip_weekends',
} as const;

/**
 * The states the monitor treats as active, in the order a board reads them.
 *
 * Documented as ESP/EXE/MAR. Observed on this tenant: ESP 28, MAR 1, EXE 0 —
 * see `workshop-monitor.service.ts` for why EXE being empty is a finding rather
 * than a bug.
 */
export const MONITOR_ACTIVE_STATUSES = ['EXE', 'ESP', 'MAR'] as const;

/** Filter parameter names the monitor accepts. CONFIRMED against the docs. */
export const MONITOR_FILTER_PARAMS = {
  status: 'status',
  plate: 'vehicle_plate',
  department: 'department',
  awaitingParts: 'awaiting_parts',
  /**
   * Narrows either monitor endpoint to one service order. CONFIRMED
   * 2026-09-26 against the live tenant: `/workshop/monitor?num=<n>` returns
   * exactly that job, in whatever state it is in — which is what lets a
   * closed order's mechanic clock-on still be read after it has left the
   * active board. See `getByNumber` in `workshop-monitor.resource.ts`.
   */
  num: 'num',
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
  /**
   * Vehicles. Takes `true`/`false` — CONFIRMED 2026-09-08 by comparing the
   * `is_active` values returned with and without it. The name `active` is
   * silently ignored, which is why it is spelled out here rather than guessed.
   */
  isActive: 'is_active',
} as const;

/**
 * Ordering. CONFIRMED on `/workshop/vehicles`, 2026-09-08.
 *
 * `sort=-created_at` returns the newest records first and `sort=created_at` the
 * oldest; without it the collection comes back in no discernible order. A
 * leading `-` is what reverses it. `order_by` is accepted and ignored.
 *
 * This is the only endpoint where ordering has been verified — service orders
 * are ordered in the service after the window is gathered, because that
 * endpoint pages by cursor and could not be trusted to order across pages.
 */
export const SORT_PARAM = 'sort';

/** `sort` value for "most recently added first". */
export const SORT_NEWEST_FIRST = '-created_at';

/* -------------------------------------------------------------------------- */
/* Transport                                                                   */
/* -------------------------------------------------------------------------- */

/** Backoff before retry n (1-based), in ms, before jitter is applied. */
export const RETRY_BASE_DELAY_MS = 300;

/** Never wait longer than this between attempts, whatever `Retry-After` says. */
export const MAX_RETRY_DELAY_MS = 5_000;

/** Only these methods are retried automatically — see `officegest.client.ts`. */
export const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
