# OfficeGest Backend

A small Node/Express service that stands between the FS Automotive site and the
[OfficeGest API](https://api.officegest.com/). It holds the OfficeGest
credential, speaks to the ERP, and exposes a narrow, validated HTTP surface that
a browser can safely call.

- **Language** — TypeScript, `strict`, ESM, Node 20.19+ / 22.12+ / 24+
- **Framework** — Express 5
- **Validation** — Zod 4, on inbound requests _and_ upstream responses
- **Tests** — Vitest, 97 tests, no network access, no real credential

---

## 1. Why a backend exists at all

The site is a static Angular bundle served from GitHub Pages. Anything compiled
into it is readable by every visitor — the repository's own
[`scripts/lib/env.mjs`](../scripts/lib/env.mjs) enforces that with an allow-list,
precisely so a secret cannot leak into the bundle by accident.

An OfficeGest credential is a key to the client's ERP: customers, vehicles,
service orders, invoicing. It cannot live in the browser under any
circumstances. This service is where it lives instead. The browser calls this
API; only this API calls OfficeGest.

```
Browser ──▶ this service ──▶ OfficeGest
             (holds the credential)
```

---

## 2. Quick start

```bash
cd server
npm install
cp .env.example .env      # then fill in OFFICEGEST_BASE_URL and OFFICEGEST_API_KEY
npm run dev               # http://localhost:3000
```

Check it is alive, and that the credential works:

```bash
curl http://localhost:3000/health
npm run probe -- /entities/customers    # one real call; prints field names, never values
```

| Script              | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Watch mode via `tsx`                              |
| `npm run build`     | Type-check and emit to `dist/`                    |
| `npm start`         | Run the built server                              |
| `npm test`          | Full suite, offline                               |
| `npm run typecheck` | `tsc --noEmit`                                    |
| `npm run verify`    | Type-check then test — run this before committing |
| `npm run probe`     | Inspect a real response's shape (see §8)          |

Every script loads, in order: the repository-root `.env` and `.env.local`, then
`server/.env` and `server/.env.local`. Later files win. **Put the credential in
`server/.env`** — the root `.env` feeds the browser build, and this one does not.

---

## 3. Configuration

Full reference with comments: [`.env.example`](.env.example).

| Variable                  | Required                   | Default        |
| ------------------------- | -------------------------- | -------------- |
| `OFFICEGEST_BASE_URL`     | yes                        | —              |
| `OFFICEGEST_AUTH_MODE`    | no                         | `bearer-login` |
| `OFFICEGEST_USERNAME`     | for `bearer-login`/`basic` | —              |
| `OFFICEGEST_API_KEY`      | yes                        | —              |
| `OFFICEGEST_PASSWORD`     | no (overrides the key)     | —              |
| `OFFICEGEST_TIMEOUT_MS`   | no                         | `10000`        |
| `OFFICEGEST_MAX_RETRIES`  | no                         | `2`            |
| `PORT`                    | no                         | `3000`         |
| `NODE_ENV`                | no                         | `development`  |
| `LOG_LEVEL`               | no                         | `info`         |
| `CORS_ALLOWED_ORIGINS`    | no                         | none allowed   |
| `BACKEND_API_KEYS`        | no                         | guard off      |
| `RATE_LIMIT_WINDOW_MS`    | no                         | `60000`        |
| `RATE_LIMIT_MAX_REQUESTS` | no                         | `120`          |

The environment is validated **once, at startup**, in
[`src/config/env.ts`](src/config/env.ts). A missing or malformed variable stops
the process with every problem listed at once — it never surfaces later as a
confusing 500. Nothing else in the codebase reads `process.env`; the rest of the
application uses `config.officegest.apiKey` and friends.

Validation failures name the variable and the reason, **never the value** — the
value is the credential.

---

## 4. Authentication — and one thing you should verify

OfficeGest publishes exactly two authentication mechanisms:

| Mode           | API | Mechanism                                                           |
| -------------- | --- | ------------------------------------------------------------------- |
| `bearer-login` | v2  | `POST /auth/login` with `{username, password}` → Bearer token       |
| `basic`        | v1  | HTTP Basic (`Authorization: Basic base64(user:pass)`)               |
| `static-token` | —   | ⚠️ **Not documented.** Sends `OFFICEGEST_API_KEY` as a Bearer token |

**You said you have an "apiKey".** OfficeGest's documentation does not describe a
standalone API key — it issues a dedicated API _user_, whose secret integrators
commonly call "the API key". So:

1. Start with `OFFICEGEST_AUTH_MODE=bearer-login`, set `OFFICEGEST_USERNAME` to
   that API user, and put your key in `OFFICEGEST_API_KEY` — it is accepted as
   the password.
2. If your tenant is on the v1 API, switch to `basic`. Same two variables.
3. Only if you were handed a ready-made token out of band, try `static-token`.
   If it answers 401, the token is not a standalone credential and the mode is
   wrong for you.

Whichever you pick, nothing above the integration layer knows about it. The
authentication flow lives entirely behind
[`src/integrations/officegest/auth/`](src/integrations/officegest/auth/):

```
Controller → Service → Resource → OfficeGestClient → AuthStrategy → OfficeGest
                                                     (token cache, refresh)
```

`bearer-login` caches the token, shares one login across concurrent requests,
renews it on expiry, and retries exactly once when OfficeGest rejects a token
mid-flight — then stops, because a second rejection means the credential itself
is wrong, not stale.

---

## 5. Endpoints

Everything is under `/api/officegest`, guarded by `x-api-key` when
`BACKEND_API_KEYS` is set. `/health` is deliberately outside the guard.

| Method | Path                                    | Query / body                                                      |
| ------ | --------------------------------------- | ----------------------------------------------------------------- |
| GET    | `/health`                               | —                                                                 |
| GET    | `/api/officegest/customers`             | `page`, `perPage` (≤100), `search` (2–120 chars)                  |
| GET    | `/api/officegest/customers/:customerId` | —                                                                 |
| GET    | `/api/officegest/vehicles`              | `page`, `perPage`, `search`                                       |
| GET    | `/api/officegest/vehicles/:plate`       | plate is normalised (`aa-00-bb` → `AA00BB`)                       |
| GET    | `/api/officegest/service-orders`        | `page`, `perPage`, `plate`, `status`                              |
| GET    | `/api/officegest/service-orders/:id`    | —                                                                 |
| GET    | `/api/officegest/appointments`          | `page`, `perPage`, `from`, `to`, `customerId`                     |
| GET    | `/api/officegest/appointments/:id`      | —                                                                 |
| POST   | `/api/officegest/appointments`          | `title`, `startsAt`, `endsAt?`, `customerId?`, `plate?`, `notes?` |

### Request / response examples

```bash
curl -H 'x-api-key: YOUR-BACKEND-KEY' \
  'http://localhost:3000/api/officegest/customers?page=1&perPage=25&search=silva'
```

```json
{
  "success": true,
  "data": [{ "id": "42", "name": "Ana Silva", "taxId": "123456789", "email": "ana@example.pt" }],
  "meta": { "page": 1, "perPage": 25, "total": 130, "totalPages": 6 }
}
```

```bash
curl -X POST -H 'content-type: application/json' -H 'x-api-key: YOUR-BACKEND-KEY' \
  -d '{"title":"Revisão dos 60.000 km","startsAt":"2026-09-10T09:00:00Z","plate":"AA-00-BB"}' \
  http://localhost:3000/api/officegest/appointments
```

```
201 Created
Location: /api/officegest/appointments/900
```

```json
{ "success": true, "data": { "id": "900", "title": "Revisão dos 60.000 km", "plate": "AA00BB" } }
```

Every failure uses one shape:

```json
{
  "success": false,
  "error": {
    "code": "OFFICEGEST_API_ERROR",
    "message": "Unable to retrieve data from OfficeGest."
  },
  "requestId": "3f1c…"
}
```

`requestId` is echoed in the `x-request-id` header and stamped on every log line
for that request.

---

## 6. Error handling

All errors funnel through
[`src/middleware/error.middleware.ts`](src/middleware/error.middleware.ts).
The mapping from upstream failure to our status is deliberate, not pass-through:

| OfficeGest              | We answer | `error.code`                    | Why                                                                                                  |
| ----------------------- | --------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 401                     | **502**   | `OFFICEGEST_AUTH_ERROR`         | Our credential is wrong. The caller cannot fix it, and 401 would tell the browser to prompt for one. |
| 403                     | **502**   | `OFFICEGEST_FORBIDDEN`          | Our API user lacks a module. Also not the caller's fault.                                            |
| 404                     | 404       | `OFFICEGEST_NOT_FOUND`          | The record genuinely does not exist.                                                                 |
| 422                     | 422       | `OFFICEGEST_VALIDATION_ERROR`   | The caller's data was refused; upstream field errors are forwarded in `details`.                     |
| 429                     | 429       | `OFFICEGEST_RATE_LIMITED`       | Passed through with `Retry-After`.                                                                   |
| 5xx / connection failed | 502       | `OFFICEGEST_UNAVAILABLE`        | Upstream fault.                                                                                      |
| timeout                 | 504       | `OFFICEGEST_TIMEOUT`            | Upstream fault, specifically slowness.                                                               |
| non-JSON / bad schema   | 502       | `OFFICEGEST_MALFORMED_RESPONSE` | Contract violation, surfaced instead of crashing deep in a mapper.                                   |

Caller-side failures use `VALIDATION_ERROR` (422), `BAD_REQUEST` (400),
`UNAUTHORIZED` (401), `NOT_FOUND` (404), `RATE_LIMITED` (429),
`PAYLOAD_TOO_LARGE` (413). Anything unexpected becomes a generic 500: the real
message and stack are logged server-side and never serialised in production.

---

## 7. Resilience

- **Timeout** on every attempt (`OFFICEGEST_TIMEOUT_MS`); nothing can hang.
- **Retries** (`OFFICEGEST_MAX_RETRIES`) with exponential backoff and full
  jitter, honouring `Retry-After`. Retried: timeouts, connection errors, 5xx, 429. **Never retried:** 401, 403, 404, 422, or a malformed response.
- **Idempotency.** Only `GET`/`HEAD`/`OPTIONS` are replayed on a transient
  failure — a retried `POST /crm/appointments` would double-book. A 429 is the
  exception: it is a refusal, so nothing was processed and any method is safe.
- **Cancellation.** A client that disconnects aborts the upstream call. Writes
  are exempt: cancelling mid-`POST` would leave nobody able to say whether the
  record was created.
- **Graceful shutdown.** `SIGTERM` closes the listener, drains in-flight
  requests, releases the OfficeGest session, then exits — with a 10s cap.

---

## 8. The unknowns, and how to close them

OfficeGest documents its base URL, authentication, envelope (`{ data, meta }`)
and endpoint paths. It does **not** publish the field names inside a record, nor
the query-parameter names for pagination and filtering. Rather than guess
silently, every guess in this codebase is marked and centralised:

| Unknown                    | Where the guess lives                                                                                   | Basis                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pagination params          | `PAGINATION_PARAMS` in [`officegest.constants.ts`](src/integrations/officegest/officegest.constants.ts) | `meta.current_page` is a Laravel paginator, which reads `page` / `per_page`                      |
| Search / filter params     | `SEARCH_PARAM`, and `UPSTREAM_FILTERS` in each service                                                  | inferred                                                                                         |
| Record field names         | the `FIELDS` map at the top of each `*.mapper.ts`                                                       | inferred; each field is read through a list of candidate names                                   |
| Appointment create payload | `toCreatePayload` in [`appointment.mapper.ts`](src/modules/appointments/appointment.mapper.ts)          | inferred — **the highest-risk one**, since a wrong field name on a write may be ignored silently |

To close them, run the probe against your tenant:

```bash
npm run probe -- /entities/customers
npm run probe -- /workshop/vehicles
```

It performs one authenticated request and prints **field names and value types
only — never values**, so no customer data reaches your terminal. Copy the real
names into the matching `FIELDS` map and delete the alternatives.

---

## 9. Architecture

```
server/src/
├── config/                 # env parsing + validation, typed config object
├── shared/                 # logger (with redaction), errors, response envelope,
│                           # pagination, use-case context
├── middleware/             # request context, logging, validation, api key,
│                           # rate limit, 404, centralised error handler
├── integrations/officegest/
│   ├── auth/               # basic | bearer-login | static-token strategies
│   ├── resources/          # one file per upstream path family
│   ├── officegest.client.ts        # transport: auth, timeout, retry, parsing
│   ├── officegest.constants.ts     # every literal of the wire contract
│   ├── officegest.errors.ts        # typed failure modes
│   ├── officegest.error-mapper.ts  # upstream failure → our HTTP status
│   ├── officegest.types.ts         # envelope schemas
│   └── officegest.record-readers.ts
├── modules/                # one folder per domain: model, dto, mapper,
│   ├── customers/          #   service, controller, routes
│   ├── vehicles/
│   ├── service-orders/
│   └── appointments/
├── routes/                 # URL layout, in one file
├── types/                  # Express request augmentation
├── container.ts            # composition root — the only place wiring happens
├── app.ts                  # Express assembly and middleware order
└── server.ts               # listener, signals, graceful shutdown
```

### Why the layers are separated

**Routes** state the HTTP surface: method, path, guards, handler. No logic, so
reading one answers "what can be called and what protects it".

**Controllers** translate HTTP to a use case and back. They hold no OfficeGest
knowledge and no business rules, which is what lets the same use case be driven
by a queue worker tomorrow. They contain no `try/catch`: Express 5 forwards a
rejected promise to the error middleware, the only place that decides what an
error looks like on the wire.

**Services** own the application rules — plate normalisation, "a booking must be
in the future", translating our filters into upstream ones. They take no
`Request` and return no `Response`, so they are testable without a server. The
clock is injected, so time-dependent rules are not flaky.

**Resources** know one upstream path family and nothing else, so a service never
contains a URL.

**The client** is the only code that speaks HTTP to OfficeGest. Base URL,
authentication, timeouts, retries, error classification and response validation
are written once here rather than being re-remembered per endpoint — and it is
the seam where a fake `fetch` is injected, which is what makes the whole suite
offline.

**Models and mappers** keep OfficeGest's schema out of our contract. A domain
model is an allow-list: a field is published because someone chose to publish
it, which is how commercial data (balances, credit limits) stays out of a
response to a public website.

**Why a container and not a DI framework:** four services and one client. A
library would add a dependency and a class of runtime resolution errors to
replace fifteen lines the compiler already checks. The one thing it buys —
a single shared client, so four modules do not open four upstream sessions — is
worth the file.

---

## 10. Security

- The credential is read from the environment only, never hardcoded, never
  logged, never in a response, never sent to the browser. `server/.env` is
  gitignored.
- `redact()` in [`logger.ts`](src/shared/logger.ts) blanks any key matching
  `authorization`, `api key`, `password`, `token`, `secret`, `cookie`, `session`
  at any depth — so even a whole headers object logged by accident is safe. It
  is enforced by test.
- Query-parameter **names** are logged; values are not. A search term can
  contain a customer's name or plate.
- All caller input is validated before a controller sees it. Path parameters are
  character-restricted, since they are interpolated into an upstream path.
- Upstream responses are validated too — an unexpected shape becomes one clear
  502 instead of a `TypeError` deep in a mapper.
- This service's own `x-api-key` guard is **separate** from the OfficeGest
  credential, compared with a timing-safe digest comparison. A leak there
  exposes these read endpoints, never the ERP.
- `helmet`, `x-powered-by` off, `trust proxy 1` (not `true`, which would let any
  caller spoof `X-Forwarded-For` and evade the rate limit), 64 kB body cap,
  CORS closed by default, and `https` enforced on the upstream URL in
  production.

---

## 11. Testing

```bash
npm test
```

97 tests, no network, no real credential — `tests/setup.ts` pins a fake
environment for the whole suite.

| Suite                          | Covers                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `officegest.client.spec.ts`    | success, token refresh on 401, Basic mode, timeout, connection failure, HTTP errors, malformed and non-JSON responses, retry and no-retry rules, concurrent login collapse |
| `env.spec.ts`                  | required variables per auth mode, https in production, and that no failure message repeats a credential                                                                    |
| `logger.spec.ts`               | redaction, including nested objects                                                                                                                                        |
| `customers.service.spec.ts`    | mapping, pagination, dropped records, upstream failure passthrough                                                                                                         |
| `appointments.service.spec.ts` | booking rules at a fixed clock, filter translation, no PII in logs                                                                                                         |
| `plate.spec.ts`                | normalisation rules                                                                                                                                                        |
| `api.spec.ts`                  | the assembled app over real HTTP: valid and invalid requests, every upstream failure's status mapping, envelope shape, request-id echo                                     |
| `api-key.spec.ts`              | the `x-api-key` guard, including key rotation                                                                                                                              |

OfficeGest is mocked by injecting `fetch` into the client
(`tests/officegest-fetch.ts`), so the mock is the transport, not the
application — every layer under test is the real one.

---

## 12. Deploying

This service cannot run on GitHub Pages, which serves static files only. It
needs a Node host — Railway, Render, Fly.io, a VPS, or any container platform.

1. `npm ci && npm run build`
2. Set the environment variables from §3 as the platform's secrets. Never bake
   them into an image.
3. `npm start`
4. Point the site at it: set `CORS_ALLOWED_ORIGINS` to the site's origin, and
   give the front end a `BACKEND_API_KEYS` value to send as `x-api-key`.
5. Health probe: `GET /health` — it does not call OfficeGest, so an upstream
   incident cannot turn into a restart loop.

Behind a proxy or CDN, keep `trust proxy` in step with the number of hops
in front of the service.
