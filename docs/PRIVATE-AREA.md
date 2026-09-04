# Private Management Area

Reference for `/gestao` — the authenticated area inside the FS Automotive
Angular application that reads and writes OfficeGest data through the backend in
[`server/`](../server/).

- **Audience** — anyone maintaining or extending this codebase.
- **Language** — English, matching the code comments, like
  [`APPLICATION.md`](APPLICATION.md). The UI itself is Portuguese.

**Contents**

1. [Why it is built this way](#1-why-it-is-built-this-way)
2. [Folder structure](#2-folder-structure)
3. [Routes](#3-routes)
4. [Authentication](#4-authentication)
5. [Permissions](#5-permissions)
6. [Data flow](#6-data-flow)
7. [The reusable pieces](#7-the-reusable-pieces)
8. [States, errors and notifications](#8-states-errors-and-notifications)
9. [Responsive and accessibility](#9-responsive-and-accessibility)
10. [Configuration](#10-configuration)
11. [Testing](#11-testing)
12. [Adding a new OfficeGest resource](#12-adding-a-new-officegest-resource)

---

## 1. Why it is built this way

### The constraint everything follows from

The OfficeGest API key grants access to the client's ERP. Anything compiled into
an Angular bundle is readable by every visitor, so the key cannot be here — not
in `environment.ts`, not in `.env`, not behind a "private" route. A hidden route
is not a security control.

```
Browser  ──▶  server/  ──▶  api.officegest.com
              (holds the credential)
```

The Angular application therefore knows one address (`API_BASE_URL`) and nothing
about OfficeGest's URL, headers, authentication or error vocabulary. The
allow-list in [`scripts/lib/env.mjs`](../scripts/lib/env.mjs) enforces this
mechanically: a variable not named there cannot reach the bundle, so an
`OFFICEGEST_API_KEY` added to `.env` by mistake is inert.

### It integrates, it does not replace

Everything already in the project is reused rather than re-invented:

| Existing convention                                                | How the private area uses it         |
| ------------------------------------------------------------------ | ------------------------------------ |
| Standalone components, signals, zoneless, `OnPush`                 | Every new component                  |
| Lazy `loadComponent` routing with `data.meta`                      | Same, plus `noIndex`                 |
| `UiButton`, `Icon`, `PageSection`, the `@theme` tokens             | The whole UI                         |
| `providedIn: 'root'` services with signal state (`ConsentService`) | `AuthService`, `NotificationService` |
| Build-time `NG_APP_*` constants behind an `InjectionToken`         | `API_BASE_URL`, `DEV_AUTH_STUB`      |
| Vitest + TestBed specs beside the source                           | All new specs                        |

Three things were added because they genuinely did not exist: `HttpClient` (with
two interceptors), an authentication layer, and a notification queue. Nothing
else about the public site changed, and the public bundle is unaffected — the
whole area is one lazy chunk.

---

## 2. Folder structure

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.contract.ts        ⚠️ the only unverified contract
│   │   ├── auth.gateway.ts         port + HTTP adapter
│   │   ├── dev-auth.gateway.ts     development stub
│   │   ├── auth.models.ts          SessionUser, Permission, Role
│   │   ├── auth.providers.ts       chooses the adapter
│   │   └── auth.service.ts         session state, as signals
│   ├── config/
│   │   ├── api.config.ts           API_BASE_URL + every backend path
│   │   ├── auth.config.ts          the dev-stub flag, double-gated
│   │   └── private-routes.config.ts the URL layout, once
│   ├── guards/auth.guard.ts        authGuard, guestGuard, permissionGuard
│   ├── interceptors/
│   │   ├── api.interceptor.ts      base URL + credentials
│   │   └── error.interceptor.ts    envelope → ApiError, 401 handling
│   ├── models/api.model.ts         the backend envelope, mirrored
│   └── services/notification.service.ts
│
└── features/private/
    ├── private.routes.ts           guards, lazy pages
    ├── login/                      the way in
    ├── layout/
    │   ├── private-shell.ts        sidebar + header + outlet
    │   ├── private-nav.data.ts     navigation as data
    │   └── toast-host/             renders the notification queue
    └── officegest/
        ├── models/                 domain types + request types
        ├── services/
        │   ├── officegest.service.ts    the only HTTP caller
        │   ├── resource-list.store.ts   list behaviour, once
        │   └── resource-detail.store.ts single-record behaviour, once
        ├── components/             table, states, search, pagination, shells
        │   └── calendar/           month grid, domain-agnostic
        ├── pages/                  dashboard + 4 resources + workers + settings
        │   ├── workers/            team roster (local data — see below)
        │   └── settings/           read-only diagnostics
        └── utils/format.ts         dates, money, plates
```

Each layer has one responsibility, and none reaches past its neighbour: a page
never builds a URL, a component never calls `HttpClient`, a service never
touches the DOM.

---

## 3. Routes

Portuguese, like the public routes — a mixed-language URL space reads like an
accident. Declared once in
[`private-routes.config.ts`](../src/app/core/config/private-routes.config.ts) so
no template contains a hand-typed path.

| Path                                     | Guard                              | Page            |
| ---------------------------------------- | ---------------------------------- | --------------- |
| `/gestao`                                | `guestGuard`                       | Login           |
| `/gestao/entrar`                         | — (redirects to `/gestao`)         | legacy link     |
| `/gestao/painel`                         | `authGuard`                        | Dashboard       |
| `/gestao/clientes`                       | `+ officegest.customers.read`      | Customer list   |
| `/gestao/clientes/:customerId`           | `+ officegest.customers.read`      | Customer        |
| `/gestao/veiculos`                       | `+ officegest.vehicles.read`       | Vehicle list    |
| `/gestao/veiculos/:plate`                | `+ officegest.vehicles.read`       | Vehicle         |
| `/gestao/folhas-de-obra`                 | `+ officegest.service-orders.read` | Work orders     |
| `/gestao/folhas-de-obra/:serviceOrderId` | `+ officegest.service-orders.read` | Work order      |
| `/gestao/marcacoes`                      | `+ officegest.appointments.read`   | Appointments    |
| `/gestao/marcacoes/nova`                 | `+ officegest.appointments.write`  | New appointment |
| `/gestao/marcacoes/:appointmentId`       | `+ officegest.appointments.read`   | Appointment     |
| `/gestao/trabalhadores`                  | `+ workers.read`                   | Worker list     |
| `/gestao/configuracoes`                  | `+ settings.read`                  | Settings        |

`authGuard` sits on the parent route, so a page added later is protected by
default rather than by remembering. `marcacoes/nova` is declared **before**
`marcacoes/:appointmentId`, or the router would treat `nova` as an id.

### `/gestao` is the front door, and the only place a refusal lands

`/gestao` is a `pathMatch: 'full'` route carrying `guestGuard`, which resolves it
both ways: the sign-in form for an anonymous visitor, the dashboard for someone
already signed in. Because it resolves in both directions it can be the entry
point _and_ the redirect target without looping, so every refusal in the area
points at one URL:

| Situation                     | Lands on              |
| ----------------------------- | --------------------- |
| Anonymous → any private page  | `/gestao`             |
| Signed in, missing permission | `/gestao` → dashboard |
| Session expires (401)         | `/gestao`             |
| Sign out                      | `/gestao`             |
| Unknown `/gestao/*` page      | dashboard             |

A static `redirectTo: 'painel'` here — which is what it used to be — could not
be a redirect target: it would bounce an anonymous visitor into a protected
route just to be turned away again.

**No `?redirect=`, anywhere.** A refused request produces a bare `/gestao`, and
after signing in the user lands on the dashboard. The URL they originally wanted
is deliberately dropped.

That costs deep-link restoration and buys the removal of an entire class of bug:
a `?redirect=` parameter is precisely the shape used for phishing, and the
safest version of a parameter you would otherwise have to validate on every path
is the one nothing produces and nothing reads. `Login` declares no `redirect`
input, so `withComponentInputBinding()` has nothing to bind a crafted parameter
to — which is the property `login.spec.ts` pins, because re-adding the input
without re-adding validation would silently reopen the hole.

Every route carries `meta` with `noIndex: true`; `SeoService` now emits
`<meta name="robots" content="noindex, nofollow">` and — just as importantly —
removes it again on the way back to a public page.

---

## 4. Authentication

### ⚠️ The one thing that is not finished

The backend has no login endpoints. Its only guard is a static `x-api-key`,
which a browser cannot hold. Rather than scatter assumptions, the entire
expectation is declared in one file:
[`core/auth/auth.contract.ts`](../src/app/core/auth/auth.contract.ts).

```
POST /api/auth/login     { email, password }  → { success, data: SessionUser } + Set-Cookie
GET  /api/auth/session                        → { success, data: SessionUser } | 401
POST /api/auth/logout                         → 204
```

Point that file at your identity provider — or implement the three endpoints in
`server/` — and nothing else changes.

**A session cookie, not a token in JavaScript.** Every call is sent with
`withCredentials: true`; the backend replies with an `HttpOnly`, `Secure`,
`SameSite=Lax` cookie. Nothing is written to `localStorage`, so an XSS flaw
cannot read the session — which it could if a JWT were stored there. That is why
there is no token handling anywhere in this codebase.

### The development stub

```bash
# .env
DEV_AUTH_STUB=true
```

Any password is then accepted at `/gestao/entrar`; `wrong` exercises the failure
path. It is gated **twice**, because a stub that accepts any password is a
complete authentication bypass:

1. `checkDevAuthStub` in [`scripts/lib/env.mjs`](../scripts/lib/env.mjs) **fails
   a production build outright** — the same mechanism that already refuses a
   malformed Analytics ID. A stubbed bundle cannot be produced.
2. `isDevMode()` in
   [`core/config/auth.config.ts`](../src/app/core/config/auth.config.ts) refuses
   the stub at runtime even if a bundle somehow carried the flag.

Either alone would be a single point of failure for the worst mistake available
in this codebase.

### The flow

```
Visitor → authGuard → AuthService.restore() → AuthGateway → backend
                            ↓
                 unknown → authenticated → PrivateShell → pages
                            ↓
                        anonymous → /gestao
```

`status` starts at `unknown`, and the guard **awaits** `restore()` before
deciding. Treating `unknown` as "not signed in" is the classic bug: every hard
refresh would bounce a signed-in user to the login page. Concurrent guards share
one in-flight promise, so several resolving at once make one request.

There is no `redirect` parameter to validate: the guard sends an anonymous
visitor to a bare `/gestao`, and sign-in always continues to the dashboard. See
§3 for why that trade is deliberate.

---

## 5. Permissions

```ts
type Permission =
  | 'officegest.read' // umbrella grant for every read view
  | 'officegest.write'
  | 'officegest.customers.read'
  | 'officegest.vehicles.read'
  | 'officegest.service-orders.read'
  | 'officegest.appointments.read'
  | 'officegest.appointments.write'
  // Not OfficeGest-backed, so deliberately outside that namespace.
  | 'workers.read'
  | 'settings.read';
```

A closed union, so a typo in a guard or a template is a compile error rather
than a silently hidden button. `officegest.read` covers every `.read`
permission **within its own namespace**, so a simple deployment can issue one
grant instead of five — but it never implies a write, and it never reaches
`workers.read` or `settings.read`. A grant named after one system must not
silently open another: without that scoping, any user with read access to
customer data would also hold the admin settings screen.

They control three things: which routes open (`permissionGuard`), which sidebar
items appear, and which actions render (the "Nova marcação" button).

> **Frontend permissions are UX, not security.** They run in the visitor's
> browser and can be bypassed with the developer tools. The backend must enforce
> the real thing. Both layers are needed; neither substitutes for the other.

---

## 6. Data flow

```
Page  →  OfficeGestService  →  apiInterceptor   →  server/  →  OfficeGest
                                     ↓
                             errorInterceptor  →  ApiError  →  page state
                                     ↓
                             NotificationService (5xx only)
```

- **Pages** describe _what_ they want: columns, a fetch, where a row goes.
- **`OfficeGestService`** is the only thing that calls `HttpClient`. It owns the
  paths (from `API_ROUTES`), drops empty parameters — `search=` fails the
  backend's 2–120 character rule — and unwraps `{ data, meta }` into `Paged<T>`.
- **`apiInterceptor`** prefixes `API_BASE_URL` and attaches credentials, so no
  service knows where the backend lives and no request can forget the cookie.
- **`errorInterceptor`** turns every failure into an `ApiError` whose `message`
  is safe to render. Backend internals never reach the screen.

**Filtering is server-side.** Every list sends its filters to the backend, which
sends them to OfficeGest. Filtering the 25 loaded rows in the browser would look
correct on page 1 and be wrong everywhere else.

---

## 7. The reusable pieces

These are what keep each page around twenty lines.

| Piece                  | What it owns                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `createResourceList`   | page, size, filters, refetch on change, **cancellation of the superseded request**, status |
| `createResourceDetail` | one record, plus a distinct `missing` state for 404                                        |
| `ResourcePage`         | heading, search, filters, table, all three states, pagination                              |
| `DetailPage`           | back link, title, the four detail states                                                   |
| `DataTable`            | semantic table, sortable headers, keyboard rows, mobile cards                              |
| `StatePanel`           | loading skeleton, empty, error — one component, one height                                 |
| `SearchField`          | debouncing (350 ms), Enter to commit, Escape to clear                                      |
| `PaginationBar`        | range label, page size, prev/next without needing a total                                  |
| `DetailList`           | the `<dl>` every detail page is built from                                                 |
| `Calendar`             | month grid, Monday-first, six fixed rows, local-day bucketing, paging                      |

Three decisions inside them are worth knowing:

- **`switchMap` is the whole trick** in `createResourceList`. A new query
  unsubscribes from the in-flight request, so a slow first page cannot arrive
  after the second and overwrite it.
- **State is folded with `scan`, not `computed`.** While page 2 loads, page 1
  stays on screen, dimmed. That means new state depends on previous state, which
  a `computed` cannot express — writing to a signal inside one is forbidden.
- **Debouncing lives in `SearchField`**, not the store. The control owns the
  keystrokes; debouncing in the store would also delay page clicks.

**Sorting is page-local, and says so.** The backend exposes no sort parameter,
so the table reorders the rows currently loaded. Inventing a `sort=` parameter
the backend ignores would look like it worked while doing nothing.

---

## 8. States, errors and notifications

Every list page renders exactly one of:

| State             | What the user sees                                          |
| ----------------- | ----------------------------------------------------------- |
| Loading (first)   | Skeleton rows, holding the space the data will fill         |
| Loading (refresh) | The existing table, dimmed, plus "A atualizar…"             |
| Empty, unfiltered | "Ainda não há registos"                                     |
| Empty, filtered   | "Sem resultados" + "Tente alterar a pesquisa ou os filtros" |
| Error             | "Não foi possível carregar os dados" + Tentar novamente     |
| Ready             | The table                                                   |

The two empty states are distinct because only one has a useful action.

### Status mapping

| Status                | Message shown                               | Toast?                |
| --------------------- | ------------------------------------------- | --------------------- |
| 0 (offline)           | "Não foi possível contactar o servidor."    | yes                   |
| 400 / 404 / 422       | the backend's own wording                   | no — the page says it |
| 401                   | session cleared, redirect to login          | warning, once         |
| 403                   | "Não tem permissão para efetuar esta ação." | no                    |
| 429                   | "Demasiados pedidos."                       | yes                   |
| 500 / 502 / 503 / 504 | our friendlier wording, not the backend's   | yes                   |

Only faults the user cannot act on interrupt them. A 404 already has an empty
state; a toast for it would be noise on top of the answer.

Errors never auto-dismiss — a success message that vanishes is fine, an error
the user missed is one they will hit again.

---

## 9. Responsive and accessibility

**Tables become cards below `lg`.** Not a sideways scroll, and not CSS trickery
on a `<table>` — a second block in the template, because a real table cannot be
reflowed into cards without losing its semantics. Columns declare a `priority`
(`primary`, `secondary`, `detail`, `hidden`) that decides where they land.

The sidebar is permanent from `lg` and an off-canvas drawer below it, closing on
navigation and on Escape. The backdrop is a real `<button>`, so it is dismissible
without a mouse.

Accessibility work that is easy to lose in a refactor, and is therefore tested:

- `<caption>`, `<th scope="col">` and `aria-sort` on every sortable header.
- Rows are `role="link"` with `tabindex="0"`, an `aria-label`, and Enter/Space.
- Toasts are a live region — `polite` normally, `assertive` for errors — and
  never steal focus.
- The login error is tied to the fields with `aria-describedby`, not floated as
  a toast, so it is heard on the input it concerns.
- A skip link, and a `<label>` on every control including the search box.
- The loading skeleton carries `aria-busy` and an SR-only "A carregar…".

---

## 10. Configuration

Only the frontend's own variables. All are public.

| Variable        | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `API_BASE_URL`  | Backend origin. Empty = same origin (proxy deployments). |
| `DEV_AUTH_STUB` | `true` enables the stub. **Fails the production build.** |

The OfficeGest key belongs to `server/.env` and nowhere else — see
[`server/README.md`](../server/README.md).

```bash
npm run install:all   # root + server/
npm start             # frontend (4200) + backend (3000)
```

---

## 11. Testing

`npm test` — 204 tests across 21 spec files, no network.

| Suite                          | Covers                                                                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.spec.ts`         | the `unknown` state, concurrent restore de-duplication, a failed backend still resolving to anonymous, umbrella permissions, logout clearing state even when the request fails                                              |
| `auth.guard.spec.ts`           | signed-in, anonymous, a refusal carrying no query string, **waiting for restore rather than deciding on `unknown`**, permission allow/deny                                                                                  |
| `officegest.service.spec.ts`   | envelope unwrapping, parameters sent, empty parameters omitted, path encoding, POST, failure propagation                                                                                                                    |
| `error.interceptor.spec.ts`    | envelope → `ApiError`, 5xx rewording, 401 signing out and redirecting, the session probe exempted, which statuses toast                                                                                                     |
| `resource-page.spec.ts`        | skeleton, rows, both empty states, error + retry, **rows kept during refresh**, page reset on filter change                                                                                                                 |
| `data-table.spec.ts`           | sort cycle, nulls last in both directions, `aria-sort`, no mutation of the input, real anchors instead of `role="link"` rows, mobile cards                                                                                  |
| `login.spec.ts`                | always continues to the dashboard, **no `redirect` input for a crafted query parameter to bind to**, a `?redirect=` on the URL ignored, non-enumerating error message, `aria-describedby` wiring                            |
| `private.routes.spec.ts`       | the front-door contract, navigating for real: every private URL turns an anonymous visitor away to `/gestao`, the deep link survives, `/gestao` resolves both ways, a permission refusal routes through it to the dashboard |
| `calendar.spec.ts`             | six fixed week rows, Monday-first alignment, **local-day rather than UTC-day placement**, time ordering, overflow count, unparseable instants dropped, month paging off a 31-day month                                      |
| `notification.service.spec.ts` | identical messages collapse instead of stacking, tone and detail keep messages distinct, the stack cap drops the oldest timer with it, errors never auto-dismiss, a repeat gets its full time again                         |
| `app.spec.ts`                  | which URLs count as private, and therefore whether the public header and footer render at all                                                                                                                               |

The backend is mocked with `HttpTestingController`; the real OfficeGest API is
never called.

---

## 12. Adding a new OfficeGest resource

The pattern is deliberately mechanical.

1. **Backend first.** Add the resource in `server/` — it is the only thing that
   may talk to OfficeGest.
2. **Model** — add the interface to `officegest/models/officegest.models.ts`,
   mirroring the backend's published shape. Add its query type to
   `officegest.requests.ts`.
3. **Path** — one line in `API_ROUTES` (`core/config/api.config.ts`).
4. **Service method** — one `list`/`one` call in `OfficeGestService`.
5. **Route** — one line in `PRIVATE_ROUTES`, one entry in `private.routes.ts`
   with its `permissionGuard`.
6. **Page** — copy `pages/customers/customers.ts`; change the columns, the fetch
   and where a row goes.
7. **Navigation** — one entry in `PRIVATE_NAV`; it appears in the sidebar and on
   the dashboard.

Steps 6 and 7 are the only ones with any judgement in them. Everything else is
a line.
