# Project Audit — architecture, logic, clean code, security

**Date** 2026-09-05 · **Scope** `src/` (Angular 21 + Tailwind 4) and `server/`
(Express 5 + TypeScript) · **Method** full read of both source trees, plus the
build tooling, the deploy path and the git history. Every finding below was
verified against the code, and the reproducible ones were reproduced.

---

## 1. Verdict

This is a well-built codebase. The layering is real and enforced, the reasoning
behind non-obvious decisions is written down next to the decision, and the test
suite targets the things that break silently rather than the things that are
easy to test. Findings 1–4 are not the result of carelessness: they are the
consequence of one unfinished piece — **user authentication** — and everything
downstream of it.

| Area                  | State                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| Frontend architecture | ✅ Strong — strict layering, zero `any`, all `OnPush`, no leaks            |
| Backend architecture  | ✅ Strong — clean vertical slices, one composition root, no framework leak |
| Logic & correctness   | 🟡 Good, with one asymmetry (§5.1) and an unverified upstream contract     |
| DRY                   | 🟡 Good, with one block duplicated four times (§6.1)                       |
| **Security**          | 🔴 **Not production-ready** — see §4.1–§4.4                                |
| Tests                 | ✅ 204 frontend + 19 tooling, no network                                   |

**Do not deploy to production until §4.1, §4.2 and §4.4 are resolved.**

---

## 2. What is genuinely good

Worth recording, because an audit that lists only faults misrepresents a
codebase.

- **`officegest.client.ts`** is the strongest file in the project. Two separate
  retry allowances (auth refresh vs transient), retries confined to idempotent
  methods with 429 as the deliberate exception, exponential backoff with full
  jitter, `Retry-After` honoured, and caller-cancellation distinguished from
  timeout via `AbortSignal.any`. No raw `Response` escapes it.
- **`error.middleware.ts`** handles the cases people forget: `res.headersSent`,
  client disconnect, body-parser failures, and stacks logged but never
  serialised.
- **Redaction by key name, not by value** (`shared/logger.ts`) — a whole headers
  object logged by accident still comes out safe.
- **Path parameters are `encodeURIComponent`-encoded** at every call site
  (`OFFICEGEST_PATHS`), so no id can traverse or inject into an upstream URL.
- **`x-request-id` is sanitised** before it reaches a log record — length-capped
  and character-filtered.
- **The frontend has no `any`, no `TODO`, no orphan subscriptions**, and only two
  unused exports (both contract types).
- **The dev auth stub is gated twice** — a build-time refusal and `isDevMode()` —
  and the two are independent on purpose.

---

## 3. How the findings are ranked

| Severity    | Meaning                                                             |
| ----------- | ------------------------------------------------------------------- |
| 🔴 Critical | Exploitable now, or blocks production outright                      |
| 🟠 High     | Breaks a core function in the intended deployment                   |
| 🟡 Medium   | Real defect; degraded security or operability                       |
| 🔵 Low      | Worth fixing, limited blast radius                                  |
| ⚪ Info     | Currently mitigated; would become a defect if an assumption changed |

---

## 4. Security

### 4.1 🔴 OfficeGest API key is in public git history

`server/.env.example` carried **two live values**, not placeholders:

| Variable              | Leaked                                   |
| --------------------- | ---------------------------------------- |
| `OFFICEGEST_API_KEY`  | ✅ yes — 42 characters, begins `8…`      |
| `OFFICEGEST_BASE_URL` | ✅ yes — the client's real tenant URL    |
| `OFFICEGEST_USERNAME` | ❌ no — empty in every committed version |
| `OFFICEGEST_PASSWORD` | ❌ no — empty in every committed version |

> **Correction.** An earlier revision of this document listed all four as
> leaked. Verified against `68216dd`: username and password were always empty.
> The severity is unchanged — `env.ts` accepts `OFFICEGEST_API_KEY` **in place
> of** the password for both `bearer-login` and `basic`, so the leaked key alone
> authenticates.

Committed in **`d2ab20e`**, **`1644163`** and **`68216dd`**, and **the repository
is public** (verified via the GitHub API). The key is readable by anyone right
now, and history retains it even though the file is gitignored today.

Compounding it: `.gitignore` listed `.env.example` and `/server/.env.example`.
That is backwards — the template is the one artefact that _should_ be committed,
carrying placeholders. Both templates say so in their own headers ("this
template is committed, so it must never contain a real value"). Ignoring them is
precisely what let a live key sit there unnoticed.

**Fix**

1. **Rotate the OfficeGest API key now.** Assume it is compromised. Nothing else
   on this list matters until this is done — the repository is public.
2. ✅ _Done in this pass:_ both templates reduced to placeholders, and
   `.gitignore` corrected so the templates are tracked while the real `.env`
   files stay ignored.
3. Purge history with `git filter-repo`, then force-push. This rewrites public
   history. **Rotation matters more than purging:** a purge cannot reach forks,
   existing clones, or GitHub's cached views of old commits.

### 4.2 🔴 The OfficeGest broker has no effective access control

Three facts combine into one hole:

- `requireApiKey()` is a **pass-through when `BACKEND_API_KEYS` is unset**
  (`api-key.middleware.ts:53`).
- It cannot be set in this deployment: the frontend is a browser SPA and
  **never sends `x-api-key`** (verified — no such header anywhere in `src/`).
  Setting it would 401 every legitimate request.
- **CORS restrains browsers only.** `curl`, Postman and any server-side client
  ignore it entirely.

So in the intended deployment, anyone who learns the API URL can read the whole
customer, vehicle, service-order and appointment database. The middleware's own
docstring anticipates an environment "reachable only from inside a private
network" — a public GitHub Pages frontend is the opposite of that.

**Root cause:** there is no user authentication (§4.3). The fix is not a better
API key; a browser cannot keep a secret.

**Fix** — implement the session endpoints in §4.3, then require a session on
`/api/officegest/*` instead of an unusable API key.

### 4.3 🟠 Authentication is unimplemented; production login cannot work

[`auth.contract.ts`](../src/app/core/auth/auth.contract.ts) documents
`POST /api/auth/login`, `GET /api/auth/session` and `POST /api/auth/logout` and
states plainly that they do not exist. Confirmed: `server/` mounts only
`/health` and `/api/officegest/*`.

Production forces the dev stub off (the build refuses otherwise), so
`HttpAuthGateway` POSTs to a 404 and every sign-in fails with _"Não foi possível
iniciar sessão."_ **Nobody can ever enter `/gestao` in production.**

**Fix** — implement the three endpoints with an `HttpOnly; Secure` session
cookie, per the contract file. This is the keystone: it also closes §4.2.

### 4.4 🟠 CORS is missing `credentials`, so no authenticated request can succeed

Every frontend call sets `withCredentials: true` (`api.interceptor.ts:54`,
`auth.gateway.ts`), but [`app.ts:57-66`](../server/src/app.ts#L57-L66) never sets
`credentials: true`. A browser rejects a cross-origin response that omits
`Access-Control-Allow-Credentials: true` — so once the site and the API are on
different hosts, **every** call fails, not only authentication.

```ts
origin: config.cors.allowedOrigins.length > 0 ? [...config.cors.allowedOrigins] : false,
credentials: true,   // ← missing
```

**Related:** the contract specifies `SameSite=Lax`. That works when the site and
API share a registrable domain (`fsautomotive.pt` + `api.fsautomotive.pt`). From
`*.github.io` to `api.fsautomotive.pt` the request is cross-site and the cookie
needs `SameSite=None; Secure`, or the browser will not send it.

### 4.5 🟡 `/health` discloses the ERP tenant and auth mode, unauthenticated

[`health.routes.ts`](../server/src/routes/health.routes.ts) returns
`officegest.baseUrl` and `officegest.authMode` to any caller. It is
unauthenticated by design — a platform probe cannot present a credential — and
the file argues the base URL "is configuration, not a secret".

That holds when the endpoint is reachable only by the platform. Exposed publicly
and combined with §4.2, it hands an attacker the tenant URL and the
authentication scheme for free.

**Fix** — return only `{ status, uptimeSeconds }` publicly and move the
diagnostic detail behind a session, or restrict `/health` at the proxy. Note the
frontend Settings page consumes these fields; it should degrade gracefully.

### 4.6 🟡 Log redaction stops silently below depth 6

`redact()` (`shared/logger.ts:50-51`) returns the value **unchanged** once
`depth > 6`:

```ts
if (depth > 6 || value === null || typeof value !== 'object') {
  return value;
}
```

A credential nested deeper than six levels is written to the log in clear. The
guard exists to bound recursion, which is right — but the safe failure mode is
to _redact_ what it will not walk, not to emit it.

Separately, `Error` values are reduced to `{ name, message }` and the **message
is never scrubbed**. An upstream error carrying a URL with a token in its message
would be logged verbatim.

**Fix** — return a marker such as `'[TRUNCATED]'` at the depth limit, and run
`message` through the same key/value scrub.

### 4.7 🟡 Vulnerable `qs` in the backend's production dependency tree

`npm audit --omit=dev` in `server/` reports **`qs@6.15.3`**, carrying two
moderate advisories:

| Advisory                                                                 | Impact                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------- |
| [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) | Denial of service via attacker-controlled `isBuffer` |
| [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) | `array-limit` bypass via bracket-key comma parsing   |

This is not a transitive dev-only issue: `qs` is what **Express parses every
query string with**, and every list endpoint on this service takes query
parameters from untrusted callers. It reaches the runtime through
`express@5.2.1` (directly, and again via `body-parser@2.3.0`).

`qs@6.16.0` is published and outside the vulnerable range. Both consumers
declare compatible ranges — `express` wants `^6.14.0`, `body-parser` `^6.15.2` —
so the fix is a lockfile refresh, **not** a major upgrade:

```bash
npm --prefix server audit fix     # or: npm --prefix server update qs
npm --prefix server run verify
```

The frontend's production tree is clean (`found 0 vulnerabilities`); its own `qs`
appears only under `supertest`, a dev dependency.

### 4.8 🔵 `page` has no upper bound

`paginationQuerySchema` (`shared/http/pagination.ts:17`) bounds `perPage` to 100
but leaves `page` open above `1`. `?page=999999999` is forwarded upstream, and
each such request spends an OfficeGest call. Cheap amplification.

**Fix** — cap `page` (e.g. `.max(10_000)`).

### 4.9 🔵 `x-request-id` is caller-controlled

Correctly sanitised, but a caller can still choose the value — including one
already in use. That degrades log correlation and lets a caller deliberately
blend their trace into another. Acceptable for a trace header; worth knowing.

**Fix (optional)** — keep the inbound value as `traceparent`/`upstreamRequestId`
and always generate your own `req.id`.

### 4.10 ⚪ `redirect: 'follow'` on upstream requests

`officegest.client.ts:339` follows redirects while carrying the credential.
Currently safe: all three strategies put it in the `authorization` header, and
the fetch spec (implemented by undici) strips `Authorization` on a cross-origin
redirect.

**It stops being safe** the moment a strategy moves the credential to a custom
header — `x-api-key`, say — because nothing strips those. If that ever changes,
switch to `redirect: 'manual'` or assert the final URL's origin.

---

## 5. Logic and correctness

### 5.1 🟡 Three of four services silently discard malformed records

`CustomersService.list` warns when the mapper drops records:

```ts
if (mapped.length !== result.items.length) {
  context.logger.warn('discarded OfficeGest customer records without an identifier', …);
}
```

`VehiclesService`, `ServiceOrdersService` and `AppointmentsService` perform the
same drop with **no warning at all** (verified: 1 of 4 services contains the
check). An upstream rename that starts silently emptying vehicle results would
show up in the customer logs and nowhere else.

This matters more than it looks, because the record readers are built on
_guessed_ field names (§5.2) — this warning is the alarm for exactly the failure
those guesses can cause.

**Fix** — lift the check into a shared helper and call it from all four (see
§6.1, which resolves both together).

### 5.2 🟡 The upstream contract is partly inferred, and a wrong guess fails silently

Three constants are explicitly marked as deductions rather than published
contract:

| Constant                                 | File                        |
| ---------------------------------------- | --------------------------- |
| `PAGINATION_PARAMS` (`page`, `per_page`) | `officegest.constants.ts`   |
| `SEARCH_PARAM`                           | `officegest.constants.ts`   |
| `UPSTREAM_FILTERS` (`plate`, `status`)   | `service-orders.service.ts` |

The failure mode is the dangerous one: a wrong parameter name is **ignored** by
the upstream, which returns an unfiltered page that this service then presents
as filtered. The user sees plausible, wrong data — no error anywhere. The
codebase names this risk itself ("the worst kind of bug, because nothing fails").

**Fix** — confirm each name against the tenant's API before production; the
`npm run probe` script is the right place. Until confirmed, treat filtered
results as unverified.

### 5.3 🔵 Fixed-window rate limiting allows a 2× boundary burst

The limiter documents its multi-instance limitation but not this one: 120
requests at _t_=59s and 120 more at _t_=61s is 240 in two seconds, twice the
intended rate. Inherent to fixed windows.

**Fix** — a sliding window or token bucket, if the limit is meant to be a real
ceiling rather than a guard rail.

---

## 6. DRY and clean code

### 6.1 🟡 The malformed-record guard is duplicated four times

Every `getById` ends with the same block — map, test, log, throw the same
`AppError(502, OFFICEGEST_MALFORMED_RESPONSE, 'OfficeGest returned an
unexpected response.')`. Verified in all four services.

**Fix** — one helper carries both this and the §5.1 warning:

```ts
// shared/officegest-mapping.ts
export function requireMapped<T>(
  value: T | undefined,
  resource: string,
  id: string,
  log: Logger,
): T {
  if (!value) {
    log.error(`OfficeGest ${resource} record has no usable identifier`, { id });
    throw new AppError(
      502,
      ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
      'OfficeGest returned an unexpected response.',
    );
  }
  return value;
}

export function mapAll<R, T>(
  items: readonly R[],
  map: (items: readonly R[]) => readonly T[],
  resource: string,
  log: Logger,
): readonly T[] {
  const mapped = map(items);
  if (mapped.length !== items.length) {
    log.warn(`discarded OfficeGest ${resource} records without an identifier`, {
      received: items.length,
      mapped: mapped.length,
    });
  }
  return mapped;
}
```

Four call sites shrink, and the §5.1 asymmetry cannot recur.

### 6.2 🔵 Four list-result interfaces differ only in one field name

`CustomerList`, `VehicleList`, `ServiceOrderList` and `AppointmentList` are each
`{ readonly <plural>: readonly T[]; readonly meta: PaginationMeta }`.

**Fix (optional)** — `interface ListResult<T> { items: readonly T[]; meta: PaginationMeta }`.
This changes the JSON field name, so it is a breaking API change; worth doing
only alongside another breaking change.

### 6.3 ⚪ Four near-identical controllers — leave them alone

The controllers repeat a `list`/`getById` shape. **Recommendation: do not
abstract this.** They are eight lines each, they read top-to-bottom, and they are
where per-resource divergence naturally lands (the appointments controller
already differs). A `BaseController` would trade clarity for a line count.
Recorded so a future reviewer does not "fix" it.

### 6.4 🔵 Frontend: two unused exports

`ApiEnvelope<T>` (`core/models/api.model.ts`) and `AnalyticsEvent`
(`core/models/analytics.model.ts`) are exported and never imported. Both document
a contract, so removal is a judgement call rather than a defect.

---

## 7. Architecture and operations

### 7.1 🟡 The rate limiter counts `/health`, and can throttle the probe that keeps the process alive

`rateLimit()` is mounted app-wide before the router, so platform health probes
consume the same budget as real traffic. A liveness probe at 1 Hz spends 60 of
120 requests per minute; at 2 Hz it exhausts the budget alone, starts receiving
429s, and the platform restarts a perfectly healthy process — a restart loop
caused by the limiter.

**Fix** — mount `/health` before `rateLimit()`, or exempt it by key.

### 7.2 🔵 Bodies are parsed before the rate limiter runs

Order in `app.ts` is `express.json()` (line 69) then `rateLimit()` (line 70). A
flood of 64 kB bodies is fully parsed before being refused. Reversing the two
makes refusal cheaper; the limiter needs nothing from the body.

### 7.3 🔵 `RateLimit-Limit` is set but not exposed to browsers

The middleware sets `RateLimit-Limit`, `RateLimit-Remaining` and
`RateLimit-Reset`; CORS `exposedHeaders` lists only the last two plus
`Retry-After`. A browser client can read how many requests remain but not the
ceiling.

**Fix** — add `RateLimit-Limit` to `exposedHeaders`.

### 7.4 ⚪ In-process rate limiting does not survive horizontal scaling

Already documented in the file: N instances give N × the limit. Recorded here so
it appears in one list with everything else. Move to a shared store before
scaling out.

---

## 8. Already fixed during this review

Both were found, reproduced and corrected in this pass; recorded for
completeness.

- **Duplicate error toasts.** The dashboard issues four requests on load; with
  the backend unreachable all four produced the same error, filling the whole
  `MAX_VISIBLE = 4` queue with one sentence — permanently, since errors never
  auto-dismiss. Reproduced (4 identical entries), then fixed in
  `NotificationService` by collapsing duplicates. A latent timer leak was fixed
  with it: a notification dropped by the cap left its dismiss timer pending.
- **The diagnostics page announced an outage it was already displaying.** The
  Settings health probe raised a toast saying the backend was unreachable, on the
  page whose purpose is to say exactly that, and again on every re-check. Fixed
  with a `REPORTS_OWN_ERRORS` HTTP context token.

---

## 9. Remediation order

**Before any production deployment**

1. **Rotate the OfficeGest credentials** (§4.1) — everything else can wait; this
   cannot.
2. Implement the three authentication endpoints (§4.3), then require a session on
   `/api/officegest/*` (§4.2).
3. Add `credentials: true` to CORS and confirm the cookie's `SameSite` against
   the real deployment topology (§4.4).
4. Commit a placeholder `server/.env.example` and un-ignore it (§4.1).
5. Patch `qs` in `server/` — one command, no major bump (§4.7).

**Shortly after**

6. Trim `/health` output, or put it behind the proxy (§4.5).
7. Redact at the depth limit instead of emitting (§4.6).
8. Extract the mapping helpers — closes the §5.1 asymmetry and the §6.1
   duplication together.
9. Move `/health` outside the rate limiter (§7.1).

**When convenient**

10. Cap `page` (§4.8); reorder body-parsing and rate limiting (§7.2); expose
    `RateLimit-Limit` (§7.3).
11. Confirm the inferred upstream parameter names with `npm run probe` (§5.2).

---

## 10. Method

- Full read of `src/` and `server/`, plus `scripts/`, `angular.json`, both
  `package.json` files, `robots.txt`, `sitemap.xml` and `deploy.ps1`.
- Automated sweeps: layer-violation greps, `any` usage, `TODO`/`FIXME`,
  `ChangeDetectionStrategy` coverage, `@for`/`track`, unsubscribed observables,
  `<img>` without `alt`, and a whole-tree dead-export scan.
- `git log -S` over the history for committed credentials.
- `npm audit` on both projects, production and dev trees separately.
- Production build, full test suite and formatter run to confirm baseline health:
  **204 frontend tests + 19 tooling tests passing**, production bundle 413 kB raw
  / 110 kB transfer, under the 500 kB budget.
- Two findings were reproduced with throwaway tests before being fixed.

**Not covered:** penetration testing, load testing, and the OfficeGest API
itself.
