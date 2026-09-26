# Project Audit — full-stack security, bugs, vulnerabilities

**Date** 2026-09-14 · **Scope** `src/` (Angular 21 + Tailwind 4) and `server/`
(Express 5 + TypeScript, 13 246 LOC) · **Method** full read of both source
trees, the build tooling, the deploy path and the git history — plus black-box
probes that drove the real middleware stack. Read-only: no file in the project
was modified during this audit.

This supersedes the audit of 2026-09-05. Section 9 records what changed.

---

## 1. Verdict

The codebase has improved substantially since the last pass. The largest finding
of that audit — that the OfficeGest broker had no effective access control — is
**resolved**: there is now a real authentication module with server-side
sessions, scrypt hashing, per-account and per-address throttling, and permission
guards mounted on the namespace rather than on individual routes. That was
verified by probe, not by reading.

Two things stop this being production-ready, and neither is a design flaw. One
is a credential sitting in public history. The other is that the API fails
**open** when it is misconfigured, and production does not refuse to start.

| Area                  | State                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| Frontend architecture | ✅ Strong — strict layering, zero `any`, all `OnPush`, no secrets in bundle; §6 closed |
| Backend architecture  | ✅ Strong — clean vertical slices, one composition root, no framework leak             |
| Access control        | 🟡 Correct when configured; **fails open** when not (§4.1)                             |
| Secrets hygiene       | 🔴 **A live key is on the public branch right now** (§5.1)                             |
| Logic & correctness   | 🟡 One confirmed concurrency bug (§5.3)                                                |
| DRY / clean code      | ✅ No `any`, no `TODO`, no empty `catch`, no dead exports found                        |
| Tests                 | ✅ 320 backend + 398 frontend, all passing, no network                                 |

**Do not deploy to production until §4.1 and §5.1 are resolved.**

---

## 2. What is genuinely good

Recorded because an audit that lists only faults misrepresents a codebase.

- **The access-control model is sound and was proven so.** Guards are applied to
  the `/api/officegest` namespace rather than per route, so an endpoint added
  later is protected by default instead of by remembering
  ([`routes/index.ts`](../server/src/routes/index.ts)).
- **`auth.service.ts` gets the hard parts right.** Every failure — unknown
  address, wrong password, disabled account — returns one 401 with one message,
  and a password is verified even when no account matches, using a _real_ hash
  from the configured set so the cost cannot drift. The three cases are
  distinguished only in the log.
- **The session cookie is textbook**: `__Host-` prefix, `HttpOnly`, `Secure`,
  `SameSite=Lax`, host-only, with independent idle and absolute timeouts, and a
  server-side record so revocation is immediate.
- **Sessions are HMAC-signed as well as random**, so a forged cookie is rejected
  by a constant-time comparison before it can probe the store.
- **`officegest.client.ts`** remains the strongest file in the project: two
  separate retry allowances, retries confined to idempotent methods with 429 as
  the deliberate exception, full-jitter backoff, `Retry-After` honoured, and
  caller-cancellation distinguished from timeout.
- **Redaction by key name, not by value** (`shared/logger.ts`) — a whole headers
  object logged by accident still comes out safe.
- **No secret reaches the browser.** Verified by direct substring match: **0 of
  3** real values from `server/.env` appear anywhere in the 610 kB production
  bundle. There is no `environment.ts` at all, and an allow-list in
  `scripts/lib/env.mjs` makes accidental exposure structurally impossible.
- **No token in web storage.** The only `sessionStorage` use is the dev stub.
- **Security headers on the API are complete** — HSTS, CSP, `nosniff`,
  `SAMEORIGIN`, `no-referrer`, and no `X-Powered-By`.

---

## 3. How the findings are ranked

| Grau       | Meaning                                                             |
| ---------- | ------------------------------------------------------------------- |
| 🔴 Crítico | Exploitable now, or blocks production outright                      |
| 🟠 Alto    | Breaks a core protection in a plausible deployment                  |
| 🟡 Médio   | Real defect; degraded security or operability                       |
| 🔵 Baixo   | Worth fixing, limited blast radius                                  |
| ⚪ Info    | Currently mitigated; would become a defect if an assumption changed |

---

## 4. Access control — the central check

Verified concretely on both layers by driving the real Express stack with
`supertest`, rather than assuming the code reads correctly.

**Confirmed working.** With accounts configured, all six OfficeGest endpoints
(`customers`, `vehicles`, `service-orders`, `employees`, `appointments`,
`workshop-monitor`) returned **401** to an unauthenticated caller. After signing
in, a session holding only `officegest.customers.read` passed the guard on
`/customers` and received **403** on `/employees`. The Angular route guards are
correctly treated as presentation only; the backend decides independently.

| Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Grau       | Estado       | Como corrigir                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§4.1 The API fails open when no access control is configured — including in production.** `identify` assigns `{ kind: 'unguarded' }` when neither accounts nor API keys exist ([`access.middleware.ts:52`](../server/src/middleware/access.middleware.ts#L52)), and `requireAccess` refuses only `anonymous` ([`:69`](../server/src/middleware/access.middleware.ts#L69)). `env.ts` validates everything else meticulously but never asserts that a guard exists in production. Probed with `NODE_ENV=production`, no `AUTH_USERS`, no `BACKEND_API_KEYS`: all six endpoints returned **502 from the upstream call** — the request passed both guards and spent the ERP credential — instead of 401. Only a startup `logger.warn` marks it. | 🔴 Crítico | ✅ Corrigido | Add a `superRefine` in `env.ts` failing the process when `NODE_ENV=production` and neither `AUTH_USERS`/`AUTH_USERS_FILE` nor `BACKEND_API_KEYS` is set. Promote the first entry of `startupWarnings` to a fatal error in production. Keep the open default for development only. |

---

## 5. Backend

| Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Grau       | Estado    | Como corrigir                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§5.1 A live OfficeGest key is in public history — and it was re-committed after the last audit fixed it.** `server/.env.example` carried a 40-char hex value in **`d2ab20e`** (2026-08-30). `1aaf274` (2026-09-05) correctly emptied it, applying the previous audit's remediation. **`90bffa5` (2026-09-07) then introduced a second, different 86-char credential**, which `89df5b7` emptied again and `5fd2cd9` removed the file entirely. `90bffa5` **is an ancestor of `origin/main`**, so that value is readable on the public repository right now. `d2ab20e` is no longer on the main line but remains in local history and in any fork, clone or cached GitHub view. | 🔴 Crítico | 🔲 Aberto | **Rotate the OfficeGest credential in the tenant first** — assume it is compromised; nothing else on this list matters until it is done. Then purge with `git filter-repo` and force-push, or make the repository private. Add a pre-commit secret scan (`gitleaks`), because the template was emptied once already and it came back. |
| **§5.2 `qs ≤ 6.15.3` (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g) reaches production via Express 5.** `npm ls qs` → `express@5.2.1 → qs@6.15.3`; it parses every inbound query string, so it is genuinely on the request path.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 🟡 Médio   | 🔲 Aberto | `npm audit fix` in `server/`, then re-run `npm run verify`.                                                                                                                                                                                                                                                                           |
| **§5.3 One disconnecting client aborts a shared upstream login for every concurrent request.** `getToken` does `this.pendingLogin ??= this.login(signal)` ([`bearer-login.strategy.ts:122`](../server/src/integrations/officegest/auth/bearer-login.strategy.ts#L122)), capturing only the _first_ caller's `AbortSignal` — which `request-context.middleware.ts` aborts when that browser navigates away. Reproduced: two concurrent callers, only A aborted, **B — which never disconnected — also failed**. Fires on cold start and after token expiry, exactly when several requests arrive together.                                                                       | 🟡 Médio   | 🔲 Aberto | Drive the shared login from an internal signal (or none), not the first caller's. Give it the client's own timeout, and let each caller's signal cancel only its own `await`.                                                                                                                                                         |
| **§5.4 Per-account lock-out is scoped per IP, so distributed brute force is unbounded.** `accountKey` joins the e-mail to the client address rather than keying on the e-mail alone ([`login-throttle.ts:147`](../server/src/modules/auth/login-throttle.ts#L147)). Each address therefore gets a fresh 5-attempt budget against the same account; the per-address counter (5×) never sees it. A 1 000-address botnet gets ~5 000 guesses. The trade-off it documents — not letting an attacker lock a named colleague out — is sound; the unbounded ceiling is the part that is not.                                                                                           | 🟡 Médio   | 🔲 Aberto | Keep the per-IP key, and add a global per-account counter with a much higher threshold and a short lock. Distributed guessing is then capped without handing anyone a lockout weapon.                                                                                                                                                 |
| **§5.5 `trust proxy: 1` is unconditional, so a directly-exposed process lets `X-Forwarded-For` spoof `req.ip`.** [`app.ts:48`](../server/src/app.ts#L48). Both the rate limiter and the login throttle key on `req.ip`, so both are evadable by rotating one header if anything other than exactly one proxy fronts the service.                                                                                                                                                                                                                                                                                                                                                | 🟡 Médio   | 🔲 Aberto | Make the hop count configurable (`TRUST_PROXY_HOPS`, default `0`) and set it per deployment to the real number of proxies.                                                                                                                                                                                                            |
| **§5.6 `..` and `.` pass the id validators and collapse the upstream path one segment.** `customerId` and `appointmentId` allow `.` ([`customer.dto.ts:37`](../server/src/modules/customers/customer.dto.ts#L37)). `encodeURIComponent` blocks slashes — so the traversal the last audit called impossible is _mostly_ impossible — but dots survive: `customerById('..')` → `/api/v2/entities/`, `serviceOrderById('..')` → `/api/v2/workshop/`. Read-only and bounded to one level, but it reaches an endpoint the route did not intend.                                                                                                                                      | 🔵 Baixo   | 🔲 Aberto | Reject ids equal to `.` or `..` (`.refine(v => v !== '.' && v !== '..')`), or require at least one alphanumeric character.                                                                                                                                                                                                            |
| **§5.7 `/health` is unauthenticated and names the tenant.** Returns `officegest.baseUrl` and `environment` ([`health.routes.ts:28`](../server/src/routes/health.routes.ts#L28)); mounted before `identify`. Unchanged since the last audit.                                                                                                                                                                                                                                                                                                                                                                                                                                     | 🔵 Baixo   | 🔲 Aberto | Keep `{status:'ok'}` public; move `baseUrl`/`authMode` behind `requireAccess()` or onto a separate internal path.                                                                                                                                                                                                                     |
| **§5.8 `server/users.json` is mode `0644`** — scrypt password hashes readable by any local account. `server/.env` is correctly `0600`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 🔵 Baixo   | 🔲 Aberto | `chmod 600 server/users.json`, and record it in the deploy runbook.                                                                                                                                                                                                                                                                   |
| **§5.9 An API key bypasses every permission check.** `requirePermission` calls `next()` for any non-session principal ([`access.middleware.ts:109`](../server/src/middleware/access.middleware.ts#L109)). Deliberate and documented, but one leaked key equals full read access to every resource.                                                                                                                                                                                                                                                                                                                                                                              | 🔵 Baixo   | 🔲 Aberto | Attach a permission set to each configured key, so a machine caller is bounded by grants rather than only by existing.                                                                                                                                                                                                                |
| **§5.10 Sessions, rate-limit windows and login throttles are per-process `Map`s.** Documented as a single-instance trade. Behind a load balancer the effective rate limit becomes N×, throttles reset per instance, and sessions break on restart.                                                                                                                                                                                                                                                                                                                                                                                                                              | ⚪ Info    | 🔲 Aberto | Before scaling past one instance, move all three to a shared store (Redis). No API change — the boundary is already isolated.                                                                                                                                                                                                         |

---

## 6. Frontend

| Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Grau     | Estado       | Como corrigir                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§6.1 `npm run deploy:stub` can publish a public build in which any password signs in.** `build:ghpages:stub` passes `--configuration development`, so `isProductionBuild()` returns `false` ([`scripts/lib/env.mjs`](../scripts/lib/env.mjs)), `checkDevAuthStub` downgrades to a warning, and `isDevMode()` is `true` — both locks open, and `ng deploy` pushes it to GitHub Pages. The comment at [`auth.config.ts:12-24`](../src/app/core/config/auth.config.ts#L12-L24) claims a stubbed bundle "cannot be produced, so it cannot be deployed": true for `npm run build`, **not** for this path. Data stays protected by the backend — unless the backend is also unconfigured, at which point this chains with §4.1. | 🟡 Médio | ✅ Corrigido | Gate on _deployment_ rather than configuration: make `checkDevAuthStub` fatal whenever the target is `ghpages`, or remove `deploy:stub` entirely. Correct the comment either way — its safety argument is currently inaccurate.                                                         |
| **§6.2 The static site ships no Content-Security-Policy.** [`src/index.html`](../src/index.html) has no CSP or `Referrer-Policy` meta tag, and GitHub Pages sets none. Helmet's strong CSP applies only to API JSON responses, which is where it matters least.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 🟡 Médio | ✅ Corrigido | Serve CSP as a real header from the host or CDN fronting the site. If it must be static, add `<meta http-equiv="Content-Security-Policy">` with at least `default-src 'self'; object-src 'none'; frame-ancestors 'none'`, allowing the Google Maps frame and the GA origins explicitly. |
| **§6.3 The monitor roster discloses staff names outside `workers.read`.** `MonitorRosterEntry` carries `employeeCode`, `name` and `department`, guarded by `officegest.service-orders.read` ([`routes/index.ts:110`](../server/src/routes/index.ts#L110)), while `/employees` requires `workers.read` — the boundary the code deliberately draws. Contact details and `login` are _not_ exposed, so the overlap is partial.                                                                                                                                                                                                                                                                                                 | 🔵 Baixo | ✅ Corrigido | Either drop `name` from the roster and join client-side for callers holding `workers.read`, or state explicitly in `routes/index.ts` that staff names are intentionally inside the service-order grant.                                                                                 |
| **§6.4 The staff roster cached in the browser outlived the session that fetched it.** `OfficeGestService` is `providedIn: 'root'` and caches the roster with `shareReplay({ refCount: false })`; signing out clears auth signals but does not reload the page, so the root injector — and the cache — survived. On a shared workshop terminal the next person to sign in was served the previous account's map, contact details included, without a request ever reaching the backend to be refused. Found on the second pass, 2026-09-14.                                                                                                                                                                                  | 🟡 Médio | ✅ Corrigido | Key the cache to the signed-in account id and drop it when that changes, compared at read time rather than from an `effect` (which flushes on Angular's schedule and can lose the race with a page rendering in the same tick).                                                         |

**Verified clean.** No `innerHTML`, no `eval`, no `document.write`. The single
`bypassSecurityTrustResourceUrl` takes a build-time constant, not user input
([`map-embed.ts:25`](../src/app/shared/components/map-embed/map-embed.ts#L25)).
No source maps in `dist/`. Route guards are applied correctly to every private
route, including the lazy and nested ones: `authGuard` on the parent, a
`permissionGuard` on each child. The frontend's `qs` advisory is a transitive
devDependency of `@angular/cli` and never reaches the browser — not a finding.

---

## 7. Cross-cutting

| Issue                                                                                                                                                                                                                                                                                                                                                                                                                                          | Grau     | Estado    | Como corrigir                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§7.1 `SameSite=Lax` is incompatible with the GitHub Pages deployment the repo is configured for.** The default is `lax` ([`env.ts:182`](../server/src/config/env.ts#L182)); with the site on `*.github.io` and the API on `fsautomotive.pt`, the request is cross-**site**, so the browser will not attach the session cookie and the private area silently fails to authenticate. It works only if site and API share a registrable domain. | 🟡 Médio | 🔲 Aberto | Decide the topology explicitly. Same domain (`fsautomotive.pt` + `api.fsautomotive.pt`) → keep `lax`, which is the safer answer. Genuinely cross-site → `AUTH_COOKIE_SAMESITE=none` with `AUTH_COOKIE_SECURE=true`, and note that `enforceOrigin` then becomes the only CSRF defence. |
| **§7.2 No HTTP→HTTPS redirect originates in the app.** HSTS is set (`max-age=31536000; includeSubDomains`) and `OFFICEGEST_BASE_URL` must be `https` in production, but the first plain-HTTP request before HSTS is cached depends entirely on the proxy.                                                                                                                                                                                      | 🔵 Baixo | 🔲 Aberto | Confirm the reverse proxy or CDN 301s HTTP→HTTPS, and add `preload` to HSTS once the domain is submitted.                                                                                                                                                                             |

**CSRF is genuinely covered twice** — `SameSite=Lax` plus `enforceOrigin` on
every state-changing method ([`access.middleware.ts:150`](../server/src/middleware/access.middleware.ts#L150)).
A request carrying `Origin: https://evil.example` received **no**
`Access-Control-Allow-Origin` header. Error responses never carry stack traces,
and both codebases follow the same conventions — no meaningful drift.

---

## 8. Remediation order

**Before any production deployment**

1. **Rotate the OfficeGest credential** (§5.1) — everything else can wait; this
   cannot, because the value is on the public branch today.
2. Make production refuse to boot unguarded (§4.1). Roughly ten lines in
   `env.ts`, and it closes the only unauthenticated path to ERP data.
3. Patch `qs` in `server/` (§5.2) — one command, no major bump.
4. Settle the deployment topology and with it the cookie's `SameSite` (§7.1).
5. Close the `deploy:stub` path, or delete it (§6.1).

**Shortly after**

6. Fix the shared-login abort (§5.3) — a real bug, and it surfaces as
   intermittent 502s that are hard to diagnose after the fact.
7. Add the global per-account throttle (§5.4) and make `trust proxy`
   configurable (§5.5).
8. Add a CSP to the static site (§6.2).

**When convenient**

9. Reject `.`/`..` ids (§5.6); trim `/health` (§5.7); `chmod 600 users.json`
   (§5.8); scope API keys to permissions (§5.9); resolve the roster/`workers.read`
   overlap (§6.3).

---

## 9. What changed since the 2026-09-05 audit

| Previous finding                                       | State                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| §4.2 Broker has no effective access control            | ✅ **Resolved** — real sessions, permissions, verified by probe        |
| §4.3 Authentication unimplemented                      | ✅ **Resolved** — `login`/`session`/`logout` implemented and tested    |
| §4.4 CORS missing `credentials`                        | ✅ **Resolved** — `credentials: true` with an explicit allow-list      |
| §4.1 API key in public history                         | 🔴 **Regressed** — emptied in `1aaf274`, re-leaked in `90bffa5` (§5.1) |
| §4.7 Vulnerable `qs`                                   | 🔴 **Still open** (§5.2)                                               |
| §4.5 `/health` disclosure                              | 🔵 **Still open** (§5.7)                                               |
| §4.6 Redaction stops below depth 6                     | ✅ Resolved — depth guard returns before emitting                      |
| §4.9 `x-request-id` caller-controlled                  | ✅ Resolved — length-capped and character-filtered                     |
| §5.1 / §6.1 Malformed-record asymmetry and duplication | ✅ Resolved — shared record readers                                    |
| §6.4 Two unused frontend exports                       | ✅ Resolved — no dead exports found                                    |

The one genuine regression is the credential. The remediation was applied
correctly and then undone two days later by a commit that was not looking for
it — which is the argument for an automated secret scan rather than a careful
reviewer.

---

## 10. Fix log

Findings are left above exactly as they were found; this records what has since
been done about them.

### 2026-09-14 — Frontend (§6) resolved

| Finding                                                  | State                 | What changed                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §6.1 `deploy:stub` could publish an any-password build   | ✅ Fixed              | The stub gate asked `isProductionBuild`, which is a question about optimisation. It now asks whether the bundle will be **shipped** — production _or_ carrying a deploy base href — via a new `isPublishedBuild` in `scripts/lib/env.mjs`. Verified on the real command line: the exact argv of `build:ghpages:stub` now exits 1 before the CLI is spawned, so `&& ng deploy` never runs. Local development still only warns. |
| §6.2 No Content-Security-Policy on the static site       | ✅ Fixed              | A policy is now served as a `<meta>` tag from `src/index.html`, with `script-src` free of `'unsafe-inline'`. Verified in headless Chrome across `/`, `/servicos`, `/sobre-nos`, `/contactos` and `/private/login`: **no violations**.                                                                                                                                                                                         |
| §6.3 Roster discloses staff names outside `workers.read` | ✅ Closed as intended | Examined rather than assumed, and documented at the route. See the correction below.                                                                                                                                                                                                                                                                                                                                          |
| §6.4 Browser roster cache outlived its session           | ✅ Fixed              | Found on a **second** frontend pass, after §6.1–§6.3 were closed. The cache is now keyed to the signed-in account id and dropped when that changes. Proven both ways: the two new regression tests fail with the guard removed and pass with it, and a third test pins that the caching itself still works (one request for the same account twice).                                                                          |

### 2026-09-14 — third pass, and a gap in my own remediation

**§6.2 was only half done.** The finding reads "no CSP **or `Referrer-Policy`**
meta tag". The CSP went in; the referrer policy did not, and nothing caught it
because the finding was already marked fixed. `src/index.html` now also carries
`<meta name="referrer" content="strict-origin-when-cross-origin">`.

It matters because the private routes are parameterised by real records, and
every page makes cross-origin subresource requests that carry a `Referer`.
Demonstrated with two local origins and a pixel, from
`/private/vehicles/AA-00-BB`:

| Policy                                           | Referer sent cross-origin     | Plate      |
| ------------------------------------------------ | ----------------------------- | ---------- |
| `strict-origin-when-cross-origin` (now shipped)  | `http://127.0.0.1:5010/`      | not leaked |
| `no-referrer-when-downgrade` (the older default) | `…/private/vehicles/AA-00-BB` | **leaked** |

Current browsers already default to the safe value, so this changes nothing
today — it pins the behaviour for those that do not. `no-referrer` was
deliberately not used: it would blind the public site's campaign attribution
without protecting anything the private area has not already covered.

**Checked on this pass and found clean** — recorded so a fourth pass does not
repeat them:

- **Analytics never sees a private URL.** `trackPageViews` filters on
  `isPrivateUrl`, and the delegated contact-click listener returns early on the
  same check — so neither a page view nor a `tel:`/`mailto:` click from a
  customer detail page sends a record id to Google. The click path was worth
  tracing separately: it is a document-level listener, so it would otherwise
  have fired on every private page.
- **`target="_blank"` links** all carry `rel`. A line-based grep suggested three
  did not; the attribute was simply on the next line.
- **Analytics debug logging** is `isDevMode()`, not a build flag.
- **GA cookie deletion** filters names against a pattern before writing, so no
  attacker-controlled string reaches `document.cookie`.
- **Login form** uses `autocomplete="username"` / `"current-password"`.
- **All four polling timers** are `toSignal` class fields and unsubscribe on
  component destroy.
- **Dead exports:** 33 exported symbols are referenced only inside their own
  file. All are component input unions (`ButtonVariant`, `BadgeTone`) or model
  types that form a module's public type surface — exported surface area, not
  dead code. Deliberately not churned.

---

**§6.4 — why a second pass found it at all.** The first pass checked the things
a frontend audit checklist names: XSS sinks, secrets in the bundle, token
storage, guards, source maps. This one is none of those. It is a _lifetime_ bug:
`providedIn: 'root'` outlives a sign-out because nothing reloads the page, and
`shareReplay({ refCount: false })` deliberately keeps the value alive after the
last subscriber leaves. Each half is reasonable; together they carry one
account's staff contact details into the next account's session, on the shared
terminal this product runs on, without a request the backend could refuse.

Two design notes worth keeping. The clear happens at **read time**, not in an
`effect`: effects flush on Angular's schedule, and a page asking for the roster
in the same tick as a sign-in would be served the previous account's copy before
the effect ran. And the dependency points feature → core, so the cache asks
`AuthService` who is signed in rather than core reaching into a feature to
invalidate it.

Adding that dependency broke 13 existing tests with `NG0201: No provider found
for AuthGateway` — test wiring, not a design fault, since only two specs build
the real service and the other eight already use fakes. Both now share one
double, `src/app/core/auth/auth.testing.ts`, deliberately not exported from the
`core/auth` barrel so application code cannot reach a test stub by accident.

**§6.2 — two things the fix had to account for, neither visible from a code read**

- Angular's build rewrites the webfont `<link>` into `media="print"
onload="this.media='all'"`. That handler exists only in the built file, so a
  policy that looked correct against `src/index.html` broke every page. It is
  covered by a `'sha256-…'` with `'unsafe-hashes'` — one exact handler body,
  not blanket inline script. Confirmed working: the stylesheet reaches
  `media="all"` and Montserrat resolves.
- `connect-src` and `API_BASE_URL` are the same fact stated in two files, and a
  disagreement between them is invisible until the private area silently cannot
  fetch. `checkApiOriginAllowed` now fails the build on a mismatch, naming the
  offending origin and the permitted list.

`frame-ancestors` is deliberately absent: it is ignored in a meta tag, and
listing it would read as clickjacking cover that is not there. It belongs in a
real header if a CDN or proxy is ever put in front — see §7.

**Correction to §6.3.** The fix this document originally proposed — "drop `name`
from the roster" — would not have closed the disclosure. Mechanics' names also
travel on every assignment as `MonitorMechanic.name`, so a caller holding only
`officegest.service-orders.read` would still have seen the name of everyone
actually working; only the idle mechanics would have been hidden. What the
roster genuinely adds is that idle set, and the board exists to show it.

Nothing `workers.read` protects is exposed: e-mail, telephone, sign-in name,
start date and active flag live on `Employee` and never on
`MonitorRosterEntry`. The reasoning, and what a future reversal would actually
require, is now written at the route in `server/src/routes/index.ts` instead of
resting on this document.

A related near-miss worth recording: `departmentId` looked like a redundant
field beside the resolved `department` name, and removing it would have broken
`mechanic-detail.ts`, which falls back to it when the departments table cannot
be read.

**Still open:** everything in §4, §5 and §7 — including both Crítico findings.

---

### 2026-09-14 — independent re-verification of §6

The four frontend fixes were re-checked from scratch rather than trusted from
the Estado column, because a row marked corrected is a claim and not evidence.
Each was exercised, not read:

| Finding | How it was re-proved                                             | Result                                                                                                                                                                |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §6.1    | Ran the real `build:ghpages:stub` argv with `DEV_AUTH_STUB=true` | exit 1, with the refusal naming the base href; the same flag on a local dev build still exits 0, so the stub remains usable where it is meant to be                   |
| §6.2    | Parsed the **built** `dist/…/index.html`, not the source         | referrer meta present; CSP present with all 11 directives; hashed every inline handler the build emitted — one handler, covered, and no stale hash left in the policy |
| §6.3    | Read the rationale block now standing in `routes/index.ts`       | present, and it states why withholding `name` from the roster alone would close nothing                                                                               |
| §6.4    | Deleted the owner guard and re-ran the suite                     | exactly the two leak tests failed and the "cache still works" control passed; guard restored, 401 green again                                                         |

The §6.2 check corrected a false alarm of my own: a line-based `grep` reported
the CSP missing from the built file, when the attribute simply spans several
lines. Parsing the HTML showed it intact. Worth recording because the cheap
check said "shipped without a CSP", which is exactly the kind of result that
gets acted on in a hurry.

**Gate:** frontend `verify` exit 0 (36 files, 401 tests, 43 tooling), backend
`verify` exit 0 (23 files, 320 tests), findings tables 17 rows and 0 malformed.

**Still open:** the same 13 — all of §4, §5 and §7, including both Crítico
findings. Nothing in §6 remains.

---

### 2026-09-14 — §4.1, the production fail-open, closed

`env.ts` now refuses to parse a `NODE_ENV=production` configuration that has
neither `AUTH_USERS`/`AUTH_USERS_FILE` nor `BACKEND_API_KEYS`. The open default
in `identify` is untouched and still correct — a fresh checkout has to work
without ceremony, or people learn to switch the guard off. What was missing is
that nothing distinguished a fresh checkout from a live deployment.

It fails during configuration rather than at first request, so the process
never binds a port in that state. A `logger.warn` was the only previous marker,
and a warning in a log nobody reads is not an access control.

Verified by booting the real server three ways, with no `--env-file` so a local
`.env` could not rescue the probe:

| Configuration                      | Before                                                                                                        | After                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| production, nothing configured     | listened; all six endpoints returned 502 — the request passed both guards and spent the OfficeGest credential | **exit 1** at config load, message naming both mechanisms; no port bound                                                                |
| production, `BACKEND_API_KEYS` set | —                                                                                                             | listens; `/health` 200; all six endpoints **401** anonymously; a valid `x-api-key` reaches upstream (502, the probe credential is fake) |
| development, nothing configured    | open                                                                                                          | **unchanged** — listens, anonymous request passes the guard, which is the point of the default                                          |

Six tests added in `env.spec.ts` (backend 320 → 326). Proved capable of failing:
disabling the guard fails exactly the three negative tests and leaves the three
positive ones passing.

The rationale comment in `access.middleware.ts` claimed `startupWarnings` was
what kept an unguarded production deployment from being silent. That is no
longer what protects it, so the comment was rewritten rather than left to be
believed — the same stale-comment failure §6.1 had.

**Still open:** 12 — §5.2–§5.10, §5.1, §7.1, §7.2. §5.1 (rotate the leaked
credential) remains the one item no code change can resolve.

### 2026-09-26 — audit of the workshop-times work (monitor, `/times`, totals)

Scope: everything added on 2026-09-26 — the `/times` hours log, the closed-order
monitor fallback, "Mecânicos que trabalharam", per-mechanic hours, the status
names, estimated time from the order's own interventions, and the real billed
total on the detail and list pages. Each finding was reproduced against the live
tenant or with a failing test before it was fixed.

| #   | Finding                                                                                                                                                                                                                                                                                                                                                   | Severity | State        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ |
| T1  | **OfficeGest timestamps were read in the server's timezone.** Upstream sends `2026-09-16 16:19:00` with no offset; `readIsoDate` used `new Date()`, correct on a Lisbon machine and **one hour late on a UTC host** in summer — every clock-on, hours-log start/end, "Entrada no sistema", appointment time, and the live timer. Nothing pinned the zone. | 🔴 High  | ✅ Corrigido |
| T2  | **`/times` answers 204 for an order with no entries**, and the client rejected the empty body as a malformed response — a schema error and a warning logged for most orders.                                                                                                                                                                              | 🟠 Médio | ✅ Corrigido |
| T3  | **Dates rendered in the viewer's device timezone** — a Lisbon workshop's times shifted for anyone reading from elsewhere, and three new tests passed only on a Lisbon machine.                                                                                                                                                                            | 🟠 Médio | ✅ Corrigido |
| T4  | **One failed board poll made an open job look closed** on the detail page for 20 s: heading "Registo de picagens", "Aberta há" with the closed-job reason, timer gone. The board was replaced with `null`; `Monitor` and `MechanicDetail` already kept the last good one. Pre-existing, made visible by the new closed-order states.                      | 🟠 Médio | ✅ Corrigido |
| T5  | **"Tempo trabalhado" rendered labour as calendar days** — 30 h of work read "1 dia 6 h" above an hours-log total of "30 h 00 min".                                                                                                                                                                                                                        | 🟡 Baixo | ✅ Corrigido |
| T6  | **A service-order id of `..` walked up the upstream path**: `encodeURIComponent` does not escape dots, so `/service-orders/../times` requested `/api/v2/workshop/times` with the server's credentials. Pre-existing in the shared validator; the new `/times` route widened it. GET-only, one segment, authenticated.                                     | 🟡 Baixo | ✅ Corrigido |
| T7  | **Mechanic page showed "0 min"** for a mechanic whose only session on an order was still open, and computed an unused `lastWorkedAt` on every load.                                                                                                                                                                                                       | 🔵 Info  | ✅ Corrigido |
| T8  | **Service-order date filter is off by one day in summer** (pre-existing): `dateValue` and `toUpstreamDate` slice the UTC form of local midnight, so "1 September" displays as 31/08, OfficeGest is asked for `date_from=2026-08-31`, and a picked date jumps back a day in the input. Visible on the live list.                                           | 🟠 Médio | ⬜ Aberto    |
| T9  | **Appointments calendar depends on the device timezone** (pre-existing): it groups and labels by local `getDate()`/`toLocaleTimeString`, and two `calendar.spec.ts` tests fail under `TZ=America/New_York` / `Asia/Tokyo`. Same class as T3, not changed here.                                                                                            | 🟡 Baixo | ⬜ Aberto    |
| T10 | **Mechanic page "Folhas de obra atribuídas" → Total** still reads `order.total`, which is one fixed eco-tax line (`6.03`) rather than the job's cost. Flagged in code; fixing it costs up to 10 more requests per page view — awaiting a decision.                                                                                                        | 🟠 Médio | ⬜ Aberto    |
| T11 | **The `awaiting_parts` monitor filter**, implemented and tested earlier on 2026-09-26, is absent from the working tree and was never committed — reverted outside the session.                                                                                                                                                                            | 🔵 Info  | ⬜ Aberto    |

How T1 was fixed, and why Lisbon: `readIsoDate` now reads an offset-less
`YYYY-MM-DD HH:mm[:ss]` as `OFFICEGEST_TIME_ZONE` (`Europe/Lisbon`) using `Intl`,
so both DST changeovers are right; a date alone or an ISO string with its own
offset keeps its old meaning. The zone is evidence, not assumption: on every
`/times` entry checked, `created_at` equals `start_time` to the second — one
clock stamps everything — and read as Lisbon that clock gives an 08:50–18:35
day with a 13:00–14:40 lunch gap. Verified by running the backend suite under
`TZ=Europe/Lisbon`, `UTC`, `America/New_York` and `Asia/Tokyo` (356/356 each);
one existing test had encoded the host-timezone behaviour and was pinned.

Known limits, left as designed: the per-line estimate pairs the order's unnamed
lines with the monitor's named ones by position — sound on all 31 active orders
checked (equal lengths, sorted), guarded by a length check, but upstream does
not publish a join key. "Tempo trabalhado" prefers the logged total over a
currently open picagem, to avoid counting a session twice once it is logged.

Tests: backend 342 → 356, frontend 454 → 457; T4's test was proved to fail with
the old behaviour restored.

---

## 11. Method

- Full read of `src/` and `server/`, plus `scripts/`, `angular.json` and both
  `package.json` files.
- **Black-box probes against the real application**, built with `createApp` +
  `createContainer` and driven with `supertest`: unauthenticated access to all
  six private endpoints, permission enforcement with a narrowed grant, the
  unconfigured-production case, security headers, CORS against a hostile origin,
  and the `/health` body.
- A targeted reproduction of the shared-login abort against
  `BearerLoginStrategy` with two concurrent callers.
- Git history swept commit-by-commit for credential values in both `.env`
  templates, classified by length and character class. Values were never printed.
- The production bundle checked by direct substring match against the real
  secrets in `server/.env`.
- `npm audit` on both projects, with `npm ls` to separate runtime from
  development trees.
- Both suites run to confirm baseline health: **320 backend + 398 frontend tests
  passing**.

**Not covered:** penetration testing, load testing, and the OfficeGest API
itself. No file in the project was modified; every probe ran from a scratch
directory outside the repository.
