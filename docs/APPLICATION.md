# FS Automotive — Application Handbook

Complete technical reference for the FS Automotive website: how it is built, how
the code is organised, how to run it, and why it is the way it is.

- **Audience** — anyone maintaining or extending this codebase.
- **Language** — this handbook is in English, matching the code comments. The
  root [`README.md`](../README.md) is the shorter Portuguese overview; where the
  two overlap, both are kept in step.
- **Project** — institutional site for FS Automotive, a multi-brand car workshop
  in Vialonga, Portugal. Four public pages, no backend.

**Contents**

1. [Architecture](#1-architecture)
2. [Code logic](#2-code-logic)
3. [Configure and run — step by step](#3-configure-and-run--step-by-step)
4. [How it is built and where things live](#4-how-it-is-built-and-where-things-live)
5. [The `scripts/` folder](#5-the-scripts-folder)
6. [Development log — what was built and why](#6-development-log--what-was-built-and-why)

---

## 1. Architecture

### 1.1 Stack

| Concern    | Choice                                   | Note                                                                      |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Framework  | Angular `^21.2`                          | Standalone components, signals, zoneless change detection                 |
| Language   | TypeScript `~5.9`                        | `strict`, plus `strictTemplates` and `noPropertyAccessFromIndexSignature` |
| Styling    | Tailwind CSS `^4.3`                      | CSS-first config — tokens live in `@theme`, not a JS config file          |
| Build      | `@angular/build:application`             | esbuild-based; lazy route chunks                                          |
| Tests      | Vitest `^4` + jsdom                      | Angular's `@angular/build:unit-test` builder                              |
| Formatting | Prettier + `prettier-plugin-tailwindcss` | Sorts utility classes deterministically                                   |
| Rendering  | Client-side only                         | No SSR — `server.ts` and `main.server.ts` do not exist                    |
| Hosting    | GitHub Pages                             | Via `angular-cli-ghpages`, served from a subpath                          |

### 1.2 Layer model

Four layers with a strict one-way dependency rule. Nothing ever points back up.

```
features/   Route-level pages. Compose shared components. Own no reusable logic.
    │
    ▼
layout/     The application frame: header, footer, mobile tab bar.
    │
    ▼
shared/     Reusable, presentational building blocks. Know nothing about routes.
    │
    ▼
core/       Models, content data, app-wide services. Depend on nothing internal.
```

**Why it matters.** A `shared/` component that imported from `features/` would
make the feature impossible to lazy-load independently, and would make the
component untestable in isolation. The rule is what keeps the five route chunks
small (see §3.5).

### 1.3 Directory map

```
fsautomotive.pt.angular/
├── docs/APPLICATION.md          ← this file
├── scripts/                     ← tooling (see §5)
│   ├── audit-responsive.mjs
│   ├── ng-env.mjs               ← .env → build-time constants
│   ├── lib/env.mjs              ← allow-list + validation (tested)
│   └── deploy.ps1
├── public/                      ← copied verbatim to the build output
│   ├── icons/                   favicons + apple-touch + PWA icons (5)
│   ├── images/brand/            logos, emblem (3)
│   ├── images/vehicles/         vehicle-category icons (6)
│   ├── images/workshop/         photos, 4 widths each (24)
│   ├── robots.txt, sitemap.xml, site.webmanifest, _redirects
└── src/
    ├── index.html               head: meta, icons, Google Fonts preconnect
    ├── main.ts                  bootstrapApplication(App, appConfig)
    ├── styles.css               design tokens, base layer, shared utilities
    └── app/
        ├── app.ts / app.html    shell: header + <router-outlet> + footer + tab bar + lightbox
        ├── app.config.ts        providers: router, zoneless CD
        ├── app.routes.ts        routes + per-route SEO metadata
        ├── core/
        │   ├── models/          11 interfaces + barrel
        │   ├── config/          analytics.config.ts + gtag.d.ts
        │   ├── data/            7 content files + barrel
        │   └── services/        Seo, StructuredData, Analytics, Consent
        ├── layout/              header, footer, mobile-tab-bar
        ├── shared/
        │   ├── components/      17 reusable components
        │   ├── directives/      reveal.directive.ts
        │   └── index.ts         public barrel for features to import from
        └── features/            home, about, services, contact, not-found
```

### 1.4 Routing

Every route is lazily loaded and carries its own SEO metadata in `data.meta`.

| Path         | Component  | Chunk (gzip) | Notes                  |
| ------------ | ---------- | ------------ | ---------------------- |
| `/`          | `Home`     | 2.75 kB      | `pathMatch: 'full'`    |
| `/sobre-nos` | `About`    | 1.60 kB      |                        |
| `/servicos`  | `Services` | 1.36 kB      | anchor `#veiculos`     |
| `/contactos` | `Contact`  | 1.35 kB      | anchor `#onde-estamos` |
| `**`         | `NotFound` | 0.95 kB      | catch-all              |

Legacy redirects preserve inbound links from the previous static site:
`/home → /`, `/sobrenos → /sobre-nos`, `/contacts → /contactos`.

Router features enabled in `app.config.ts`:

- `withInMemoryScrolling` — restores scroll position on back, honours `#fragment`
- `withComponentInputBinding` — route params bind straight to component inputs
- `withViewTransitions({ skipInitialTransition: true })` — native cross-fade

### 1.5 Change detection

The app is **zoneless** (`provideZonelessChangeDetection()`, and `zone.js` is not
a dependency). Every component uses `ChangeDetectionStrategy.OnPush`, and all
reactive state is a signal. Practical consequence: **state must be a signal or a
change will not render.** Mutating a plain field will not repaint.

### 1.6 Design system

All visual decisions live in `src/styles.css` as Tailwind v4 `@theme` tokens —
colours, the fluid type scale, spacing rhythm, shadows and easing. Components
consume tokens as utilities (`bg-brand-600`, `text-h2`, `shadow-btn`); they never
hard-code a hex value.

Three palettes: **brand** (red, from the logo `#d91c1f`), **ink** (near-black
neutral), **bone** (warm off-white page background, inherited from the original
site).

---

## 2. Code logic

### 2.1 Content as data — the central idea

No copy, phone number or service description is written inside a template.
Content lives in `core/data/` as typed constants; components render whatever
they are handed.

```
core/models/*.model.ts     ← the shape (WorkshopService, GalleryImage, …)
        │
core/data/*.data.ts        ← the values (SERVICES, SITE, NAV_LINKS, …)
        │
features/ + shared/        ← render it
```

**Why.** The phone number appears in the header, hero, footer, contact page, CTA
band and the JSON-LD structured data. It is written **once**, in `SITE`. Changing
it is a one-line edit that cannot drift out of sync.

The same principle makes the opening hours both human- and machine-readable from
one source: `OPENING_HOURS` carries display strings _and_ `schema.org` day codes,
so `StructuredDataService` and `OpeningHours` can never disagree.

### 2.2 Key mechanisms

**Typed icon registry** — `IconName` is a union of every available glyph;
`ICON_SHAPES` maps each to primitive shapes drawn on a 24×24 grid. A misspelled
`<app-icon name="phne">` is a compile error, not a blank space. Outlines follow
Lucide (ISC licensed).

**`UiButton` — one button, three host elements.** Renders an `<a routerLink>`, an
`<a href>` (for `tel:`/`mailto:`/external) or a `<button>` depending on inputs.
The projected content lives in a single `<ng-template>` reused via
`ngTemplateOutlet`, so the label and icon markup exist once.

> **Host contract.** The component host is a real box (`display: inline-flex`,
> declared in the _base layer_ of `styles.css`, not as a host class). This is
> deliberate — see §6.3, defect 7. Layout classes a caller puts on the host
> (`class="mt-8"`, `shrink-0`) therefore behave normally, and because an element
> selector loses to any utility, `class="hidden lg:inline-flex"` also works.

**`Accordion` + `AccordionItem`** — the parent provides `AccordionState` through
Angular DI (`providers: [AccordionState]`), so each accordion instance gets its
own state and nested accordions cannot interfere. The panel animates with a
`grid-template-rows: 0fr → 1fr` transition, so no height is measured in JS.

**`Lightbox` — one instance, service-driven.** `LightboxService` (root) holds the
open image; a single `<app-lightbox />` in the shell does the rendering, so the
overlay markup exists exactly once no matter how many galleries exist. Background
scrolling is locked by pinning `<body>` with `position: fixed` at a negative
offset, and the offset is replayed on close (§6.3, defect 2).

**`Carousel`** — signal-driven index with a `setInterval` started in
`afterNextRender` and cleared via `DestroyRef.onDestroy`. Autoplay pauses on
hover, on focus, when the tab is hidden, and when the visitor prefers reduced
motion.

**`ResponsiveImage`** — derives a `srcset` from a filename convention
(`oficina-1.jpg` → `oficina-1-480.jpg`), so content data stays free of generated
filenames. Each caller supplies a `sizes` hint describing its grid slot. A phone
pulls ~40 kB per photo instead of ~205 kB.

**SEO** — `App` watches `NavigationEnd`, walks to the deepest activated route,
and hands `data.meta` to `SeoService`, which sets title, description, Open Graph,
Twitter and canonical tags. `StructuredDataService` publishes a
`schema.org/AutoRepair` JSON-LD graph once at bootstrap, built from `SITE`,
`OPENING_HOURS` and `SERVICES`.

**`RevealDirective`** — fades elements in on scroll via `IntersectionObserver`.
It degrades safely: the hidden class is applied **only** after confirming the
observer exists and reduced motion is not requested, so content is never left
invisible.

### 2.3 The responsive engine

Three layers that hand off to each other, plus capability variants. Full detail
lives in the README's _Escala responsiva_ section; the summary:

1. **Nine breakpoints** (`xs` 480 → `5xl` 3840), declared in `rem` so media
   queries resolve against the browser's initial font size and stay immune to
   the root scaling below.
2. **Fluid type and rhythm** via `clamp()` — ramps from a 375px phone to a
   1536px desktop with no steps. Minimum body size is 12px on any device.
3. **Root font scaling above 1920px** (17/19/24px). Because Tailwind spacing is
   rem-based, this lifts type, spacing, icons and radii together — what a
   10-foot TV viewing distance needs.

Capability variants cover what width cannot express: `tv:` (large _and_
remote-driven), `touch:` (`hover: none`), `short:` (landscape phone).

### 2.4 The horizontal-overflow guard

Three independent levels, because a page that can be dragged sideways is the
single most visible responsive failure:

1. **Nothing overflows by construction** — decorative glows are painted as
   `background` gradients (`glow-corner`, `glow-diagonal`), not as oversized
   blurred elements clipped by `overflow: hidden`.
2. **Root guard** — `html, body { overflow-x: clip }`. `clip`, not `hidden`:
   `hidden` would turn the root into a scroll container and break the sticky
   header. Plus `overscroll-behavior-x: none` to stop drag-to-go-back chaining.
3. **Automated guard** — `npm run audit:responsive` fails if any element escapes
   the viewport (§5.1).

---

### 2.5 Analytics (GA4, cookieless)

Enabled by setting `GOOGLE_ANALYTICS_ID` in `.env` (template: `.env.example`).
With it unset, analytics is completely inert — no script, no request, no
listener.

| Variable                   | Effect                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_ANALYTICS_ID`      | The GA4 Measurement ID. Empty or absent disables everything.                                                                             |
| `GOOGLE_ANALYTICS_ENABLED` | Optional kill switch. `false` builds with the ID but reports nothing — for a staging deploy that must not pollute the client's property. |

`.env` holds the team value; `.env.local` is read afterwards and overrides it,
for a personal ID. Both are gitignored. `.env.example` is the committed
template and never holds a real value.

**How the value gets in.** The site is browser-only, so nothing can read `.env`
at runtime; the ID is a _build-time_ constant:

```
.env, .env.local ──(node --env-file-if-exists)──►  process.env
                                                       │
                                     scripts/ng-env.mjs │ allow-list + validation
                                                       ▼
                    ng build --define NG_APP_GOOGLE_ANALYTICS_ID="G-…"
                                                       │  esbuild substitution
                                                       ▼
                       core/config/analytics.config.ts  →  ANALYTICS_CONFIG
```

Node loads the files itself, so there is no dotenv dependency. Three details
make this safe:

- **An explicit allow-list**, not a blanket `process.env` forward. Anything
  defined here is readable by anyone in the browser, so a secret added to `.env`
  can never leak into the bundle by accident. (A GA4 Measurement ID is not a
  secret — it is visible in the page source of every site using Analytics. It
  lives in `.env` for per-environment configuration, not secrecy.)
- **A `typeof` guard** in the config file. The injected identifier only exists
  after esbuild substitutes it; `typeof` on an undeclared identifier is defined
  behaviour in JavaScript, so unit tests and a bare `ng build` resolve to `''`
  instead of throwing.
- **Validation before the build starts.** A malformed ID — a UA property, a GTM
  container, the `G-` prefix lost in a copy-paste — **fails a production
  build**. This is the only place the mistake is catchable: in the browser it is
  perfectly silent, the site works, and nothing is ever reported. Locally it
  warns and carries on with analytics off, so a typo cannot block someone
  working on something else.

`ng deploy` has no `--define` option, so `npm run deploy` builds first
(`build:ghpages`, which injects the env and sets the base href) and then
publishes the existing output with `ng deploy --no-build`.

**What `AnalyticsService` does when enabled:**

1. **Consent Mode v2 defaults pushed before gtag.js loads.** Advertising is
   always denied; `analytics_storage` is granted only for a visitor who has
   already accepted, and denied otherwise. Ordering matters twice over —
   consent queued after `config` would let GA4 start on permissive defaults,
   and a returning visitor's grant must ride in the _default_ rather than a
   later update, or the session's first `page_view` is unreportable. Tests
   assert both.
2. **Manual page views.** `send_page_view: false`, then one `page_view` per
   router `NavigationEnd`. Without this an SPA only reports the landing page.
   Two details are load-bearing:
   - **The title comes from the route's `data.meta`, not `document.title`.**
     `SeoService` applies the title from an `effect`, which flushes _after_ the
     router event — reading the DOM here reported the _previous_ page's title
     on every navigation but the first. Both now derive it from
     `SeoService.documentTitle()`, so they cannot drift.
   - **`page_path` drops the query string and fragment; `page_location` keeps
     them.** A campaign link arriving with `?fbclid=…` would otherwise split one
     page across hundreds of rows in the Pages report. GA4 reads `utm_*` tags
     from `page_location`, so stripping them there would break attribution.
3. **Contact events via one delegated listener.** `phone_click`, `email_click`
   and `directions_click` — a workshop site converts when someone calls, writes
   or asks for directions. GA4's enhanced measurement instruments outbound
   _http_ links only, so it never sees a `tel:` or `mailto:` click; without
   these the site would report traffic and no outcomes. The phone number alone
   is rendered in the header, hero, footer, contact cards, CTA band and 404
   page, so one document-level listener covers all of them and any future one.

Add an event by extending `GaEventName` and `GaEventParams` in
`core/models/analytics.model.ts`, then calling
`analytics.trackEvent('name', { … })`. The name and its parameters are checked
against each other, because a mistyped event name is invisible in GA4 — it
simply creates a new, empty event that nobody notices for weeks. Every public
method is a no-op while disabled, so call sites need no guard.

There is no queue of our own for events fired before gtag.js finishes
downloading: the `gtag` shim installed at startup pushes onto `dataLayer`, and
the library replays that queue when it arrives. A second queue would be dead
code.

**Testing it.** `debug_mode` is sent when `isDevMode()` is true, so `npm start`
streams events into GA4 → Admin → **DebugView** in real time. Production builds
never send it (verified at runtime, not by grepping the bundle — the string
survives minification but the branch does not execute). Point local development
at a **separate GA4 property**, or dev traffic lands in the client's production
reports.

**`anonymize_ip` is deliberately not sent.** It was a Universal Analytics
parameter; GA4 ignores it and truncates IP addresses for every event
regardless. Sending it would only imply a control that does not exist.

**Why acceptance must grant `analytics_storage`.** The site originally ran
permanently denied, and never granted the category to anyone — accepting the
notice changed nothing about storage, by design and with a test pinning it
there. That looked like the maximally private choice. What it actually produced
was a GA4 property that reported **nothing at all**, indefinitely.

A hit sent with `analytics_storage: denied` is a _cookieless ping_: no client
id, no session id, no user-scoped dimensions. Google accepts it and keeps it
solely as input to behavioural modelling. It appears in no Realtime report, no
DebugView, and no standard report. Modelling only switches on above published
thresholds — roughly 1,000 denied events/day **and** 1,000 _granted_ users/day —
and the second is unreachable by construction when nothing is ever granted.

The failure mode is unusually quiet: the requests genuinely leave the browser
and genuinely reach Google (`/g/collect?v=2&tid=G-…` returns 204), the wiring
tests all pass, and the property stays empty. It was diagnosed only by reading
`gcs=G100` out of a captured request.

So the notice is now a real consent banner: accepting grants
`analytics_storage`, GA4 may set its cookie, and the visit is reported.
Advertising categories stay denied in every state — the site runs no ads, and
reporting does not depend on them. `AnalyticsService.setConsent()` remains the
all-categories hook, still unwired, for an advertising banner that does not
exist. Sending a visitor's IP to Google remains a separate GDPR processing
question for the client.

### 2.6 The privacy notice

`shared/components/cookie-notice/` — a genuine consent banner, though it still
gates nothing: measurement runs cookielessly while it is on screen, which needs
no prior consent, and the page stays fully usable behind it.

| Decision   | Notice | Measurement                      | Cookies | Stored      |
| ---------- | ------ | -------------------------------- | ------- | ----------- |
| `unknown`  | shown  | runs — cookieless, unreported    | none    | **nothing** |
| `accepted` | hidden | runs **and reaches the reports** | GA4's   | the choice  |
| `declined` | hidden | never starts; nothing is sent    | none    | the choice  |

Note what `unknown` costs: those visits are measured but invisible, for the
reason above. That is the price of not gating the page on a click, and it is
paid knowingly.

Four decisions are worth recording:

- **It runs while the notice is showing.** Waiting for a click would lose the
  landing page view for the great majority of visitors who never interact, in
  exchange for no privacy gain — nothing is stored or read on their device
  either way. This is the opt-out posture, not a consent gate.
- **Nothing is written until the visitor chooses.** Eagerly persisting a default
  would put a key on the device of someone who ignored the notice, which is
  precisely what running cookieless avoids. The one thing stored, once they
  choose, is the choice — the storage every privacy regime exempts as strictly
  necessary, because there is no way to honour "do not measure me" on the next
  visit without remembering it.
- **It is not a modal.** No focus trap, no backdrop, no `role="dialog"`. Nothing
  is gated on the answer, so dimming the site to announce that nobody is being
  tracked would cost every visitor more than the message is worth. A test
  asserts this, because "make the banner blocking" is the kind of change that
  gets made by reflex.
- **Refusing mid-visit stops sending immediately**, checked on every call rather
  than cached at startup. gtag.js cannot be unloaded once fetched, so that — not
  unloading — is the guarantee; it has stored nothing either way. A visitor who
  refused on an earlier visit gets no script and no listeners at all.

`ConsentService` guards every `localStorage` access with `try`/`catch`: access
_throws_ rather than returning null when a browser blocks site data or is in
Safari's private mode. A privacy notice that crashes the page for the most
privacy-conscious visitors would be a poor joke. The key is namespaced
(`fsautomotive:analytics-consent`) because GitHub Pages serves every project of
an account from one origin.

---

## 3. Configure and run — step by step

### 3.1 Prerequisites

| Tool       | Version                                | Check                       |
| ---------- | -------------------------------------- | --------------------------- |
| Node.js    | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | `node -v`                   |
| npm        | 8+                                     | `npm -v`                    |
| Git        | any                                    | `git --version`             |
| Chrome     | any recent                             | only for `audit:responsive` |
| PowerShell | 5.1+ or `pwsh` 7+                      | only for `deploy.ps1`       |

> The Node range is enforced by `engines` in `package.json`. Angular 21 refuses
> to run on older versions.

### 3.2 Install

```bash
git clone git@github.com:sadiq-x/fsautomotive.pt.angular.git
cd fsautomotive.pt.angular
npm ci          # use `npm install` if there is no lockfile
```

### 3.3 Run in development

```bash
npm start       # http://localhost:4200, hot reload
```

### 3.4 Test

```bash
npm test           # single run  — currently 10 files, 86 tests
npm run test:scripts  # build tooling — 13 tests, Node's own runner
npm run test:watch # re-runs on change
```

### 3.5 Build for production

```bash
npm run build      # → dist/fsautomotive/browser
```

Current output — initial payload **92.98 kB gzipped**:

| Bundle        | Raw               | Gzip         |
| ------------- | ----------------- | ------------ |
| Initial total | 359.32 kB         | 92.98 kB     |
| ├ framework   | 282.42 kB         | 78.33 kB     |
| ├ styles      | 58.02 kB          | 8.58 kB      |
| └ main        | 18.88 kB          | 6.07 kB      |
| Lazy routes   | 1.90–7.68 kB each | 0.95–2.75 kB |

### 3.6 Verify before pushing

```bash
npm run verify        # format:check + test + build — fast, no browser needed
npm run verify:full   # the above + the responsive audit (needs Chrome)
```

`verify` is deliberately browser-free so it runs anywhere, including CI
containers without Chrome. `verify:full` is the pre-release gate.

### 3.7 Deploy

```bash
./scripts/deploy.ps1        # recommended — guards + confirmation (§5.2)
npm run deploy              # raw: ng deploy --base-href=/fsautomotive.pt.angular/
```

### 3.8 Troubleshooting

| Symptom                                       | Cause and fix                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `The Angular CLI requires a minimum Node.js…` | Node too old — see §3.1                                                                           |
| A signal change does not repaint              | The app is zoneless; state must be a `signal`, not a plain field                                  |
| A Tailwind class has no effect                | Not in a scanned file, or built from a runtime-concatenated string — Tailwind scans literals only |
| Fonts look wrong offline                      | Google Fonts is external; the fallback stack takes over. Layout is audited with fonts blocked     |
| `audit:responsive` says "Chrome not found"    | Set `CHROME_PATH` to the binary                                                                   |
| `audit:responsive` says "port already in use" | A previous run is still alive — `pkill -f audit-responsive`                                       |
| Deep link 404s on a new host                  | The host needs an SPA fallback to `index.html` (GitHub Pages is handled via `404.html`)           |

---

## 4. How it is built and where things live

### 4.1 "I want to change X" → edit Y

The fastest way to navigate this codebase.

| To change…                                    | Edit                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Phone, e-mail, address, socials, company name | `core/data/site.data.ts`                                                            |
| The service catalogue                         | `core/data/services.data.ts`                                                        |
| Vehicle categories                            | `core/data/vehicles.data.ts`                                                        |
| Opening hours (display **and** schema.org)    | `core/data/opening-hours.data.ts`                                                   |
| "Sobre nós" story, values, amenities          | `core/data/about.data.ts`                                                           |
| Workshop photos and captions                  | `core/data/gallery.data.ts` + `public/images/workshop/`                             |
| Menu items and their icons                    | `core/data/navigation.data.ts`                                                      |
| Page titles / meta descriptions               | `app.routes.ts` (`data.meta`)                                                       |
| Enable analytics                              | `.env` → `GOOGLE_ANALYTICS_ID`                                                      |
| Add a tracked event                           | `core/models/analytics.model.ts` (name + params) then `analytics.trackEvent(…)`     |
| Brand colours, type scale, spacing, shadows   | `src/styles.css` (`@theme`)                                                         |
| Button appearance or states                   | `shared/components/ui-button/ui-button.ts`                                          |
| Add a new icon                                | `core/models/icon.model.ts` (name) + `shared/components/icon/icon-paths.ts` (shape) |
| Add a page                                    | `features/<name>/` + a route with `data.meta` in `app.routes.ts`                    |
| Header / footer / mobile nav                  | `layout/`                                                                           |

### 4.2 Conventions

- **No `.component` suffix.** Files are `header.ts` exporting `Header`, per the
  Angular v20+ style guide and the CLI default.
- **Templates are separate `.html` files.** With Tailwind, templates get long;
  inline templates would bury the class in noise.
- **No per-component CSS files.** Styling is utilities plus tokens. The only
  stylesheet is `src/styles.css`.
- **Barrels** — `core/models`, `core/data`, `core/services` and `shared` each
  export a barrel so features import from one path.
- **`protected` members** for anything a template reads; `private` for internals.
  Nothing a template needs is `public` by accident.
- **Content data is `readonly` and `as const`-shaped**, so a typo in a component
  that tries to mutate it fails at compile time.

### 4.3 Test coverage

10 spec files, 86 tests, plus 13 for the build tooling. They target logic that
is easy to break silently:

| Spec                        | Guards                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content.spec.ts`           | Unique ids, icons that exist in the registry, nav links that match real routes, paired opening/closing times, a dialable phone href                                                                  |
| `seo.service.spec.ts`       | Title, meta and canonical tags per route                                                                                                                                                             |
| `accordion-state.spec.ts`   | Single vs multiple open, toggle, close-all                                                                                                                                                           |
| `lightbox.service.spec.ts`  | Open/close, next/previous wrap-around                                                                                                                                                                |
| `lightbox.spec.ts`          | Scroll lock pins and restores the exact offset                                                                                                                                                       |
| `responsive-image.spec.ts`  | `srcset` derivation, intrinsic size, lazy vs priority                                                                                                                                                |
| `ui-button.spec.ts`         | Element polymorphism, host-class contract, `link` has no pill padding                                                                                                                                |
| `analytics.service.spec.ts` | Inert while disabled; consent denied before config; script added once; page view per navigation with the right title and no query string; contact-link detection; opt-out blocks loading and sending |
| `consent.service.spec.ts`   | Undecided by default, nothing stored until a choice, decision survives a reload, unrecognised values read as undecided, blocked storage does not throw                                               |
| `cookie-notice.spec.ts`     | Shown only while undecided, both buttons wired, accurate copy, never a modal                                                                                                                         |
| `scripts/lib/env.test.mjs`  | Measurement ID validation, the allow-list, and which builds count as production                                                                                                                      |

---

## 5. The `scripts/` folder

Repository tooling that is not part of the shipped bundle. Both scripts resolve
the repository root from their own location, so they run correctly from any
working directory.

### 5.1 `audit-responsive.mjs` — responsive regression guard

**Why it exists.** Horizontal overflow is invisible to unit tests (jsdom has no
layout engine) and can be reintroduced by a single stray utility class. This
serves the production bundle, drives headless Chrome across a device matrix, and
fails if any element escapes the viewport.

```bash
npm run audit:responsive                  # default sweep: 5 widths × 3 pages, ~24s
AUDIT_FULL=1 npm run audit:responsive     # full sweep:    9 widths × 5 pages, ~68s
```

| Variable        | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| `AUDIT_FULL=1`  | Widen to every width and route (use before a release) |
| `AUDIT_WIDTHS`  | Comma-separated widths, e.g. `375,768`                |
| `AUDIT_PAGES`   | Comma-separated routes, e.g. `/,/contactos`           |
| `AUDIT_DEBUG=1` | Print startup checkpoints                             |
| `CHROME_PATH`   | Override Chrome's location                            |

Exit `0` clean, `1` with a per-offender report naming the element and its
overflow. Implementation notes worth knowing before editing it:

- It blocks the Google Fonts CDN — faster, and fallback metrics are the wider,
  more conservative case to measure.
- Its overflow probe **deliberately ignores the root `overflow-x: clip` guard**
  by stopping the ancestor walk before `<body>`. Honouring it would mask every
  real offender and the audit would pass vacuously (this actually happened — see
  §6.3, defect 6).
- It uses random ports and hard timeouts on every CDP call, so a stale instance
  cannot make it hang.

### 5.2 `deploy.ps1` — guarded publish to GitHub Pages

Wraps `ng deploy` with the checks a publish deserves. Requires PowerShell 5.1+
or `pwsh` 7+.

```powershell
./scripts/deploy.ps1                      # verify, confirm, publish
./scripts/deploy.ps1 -WhatIf              # dry run — publishes nothing
./scripts/deploy.ps1 -BaseHref '/'        # for a custom domain
./scripts/deploy.ps1 -SkipVerify -AllowDirty   # re-publish an already-verified commit
```

| Parameter     | Effect                                                     |
| ------------- | ---------------------------------------------------------- |
| `-BaseHref`   | Base path; defaults to `/fsautomotive.pt.angular/`         |
| `-SkipVerify` | Skip format, tests and build                               |
| `-AllowDirty` | Publish despite uncommitted changes                        |
| `-WhatIf`     | Show what would happen (free from `SupportsShouldProcess`) |
| `-Confirm`    | Force the confirmation prompt                              |

What it does, in order: resolve repo root → check `npm`/`npx` on PATH → refuse a
dirty working tree → `npm ci` if `node_modules` is missing → `npm run verify` →
confirm → `ng deploy`. Any non-zero exit code from a child process becomes a
terminating error, so a failed build can never silently proceed to publish.

**Why `--base-href` matters.** The site is served from
`https://<user>.github.io/fsautomotive.pt.angular/`. Assets in `index.html` are
referenced relatively, so they resolve against that `<base href>`.
`angular-cli-ghpages` additionally writes `404.html` (a copy of `index.html`,
which is what makes deep links work on GitHub Pages) and `.nojekyll`.

### 5.3 `ng-env.mjs` — `.env` → build-time constants

Not run directly; it backs `npm start`, `npm run build`, `watch` and
`build:ghpages`. It reads `process.env` (populated by Node's
`--env-file-if-exists`, `.env` then `.env.local`) and forwards allow-listed
variables to the Angular CLI as `--define` flags.

The decisions worth testing — the allow-list, Measurement ID validation, and
which invocations count as a production build — live in `scripts/lib/env.mjs`,
which is pure and has no side effects. `scripts/lib/env.test.mjs` covers it,
run by `npm run test:scripts` with **Node's own test runner**: this is build
tooling, it never enters the browser bundle, and Angular's test builder only
looks at `src/**/*.spec.ts`. No extra dependency, consistent with the rest of
`scripts/`.

To expose a new variable, add its name to `EXPOSED_ENV_VARS`, then read it in
TypeScript through a `declare const NG_APP_<NAME>` plus a `typeof` guard — the
pattern in `core/config/analytics.config.ts`. Only `build` and `serve` accept
`--define`, so any other command is passed through untouched.

### 5.4 Adding a script

Put it in `scripts/`, resolve the repo root from the script's own location, exit
non-zero on failure, and add an npm alias in `package.json`. If it is a gate that
must run everywhere, add it to `verify`; if it needs a browser or credentials,
add it to `verify:full` instead so `verify` stays portable.

---

## 6. Development log — what was built and why

This section records how the application was produced, the defects found along
the way, and the reasoning behind the non-obvious decisions. It is written for
whoever inherits the code and wonders "why is it like this?".

### 6.1 Origin

The source was a static site: four hand-written HTML pages (`home`, `sobrenos`,
`servicos`, `contactos`), one 700-line `styles.css`, and one `scripts.js`
containing an accordion toggle, an image modal and a carousel. The header, mobile
nav and footer were **copy-pasted into all four pages** — the duplication that
motivated the rebuild.

Everything the client actually publishes was preserved: services, vehicle types,
opening hours, amenities, contacts, Maps embed, socials, and the workshop photos.

### 6.2 Build phases

1. **Scaffold** — Angular 21 (not 22: the installed Node 22.14 is below Angular
   22's minimum), Tailwind v4 via PostCSS, assets copied and renamed into a
   predictable `public/` layout.
2. **Architecture** — models and content data extracted first, then the shared
   component library, then layout, then the five feature pages. Content-first
   ordering meant components were written against real shapes, not guesses.
3. **Responsive system** — replaced discrete breakpoint steps with the fluid
   scale, added tablet/TV coverage, generated 4 renditions per photo.
4. **Hardening** — the defects in §6.3, each verified with a measurement rather
   than a screenshot impression.
5. **Design refinement** — button system, elevation scale, interactive chrome.
6. **Tooling and docs** — responsive audit, deploy script, this handbook.

### 6.3 Defects found and fixed

Each was reproduced and measured before being fixed, then re-measured after.

| #   | Defect                                                                       | Root cause                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 76px dead gap mid-page; footer's last lines hidden behind the tab bar        | `pb-safe-nav` was on `<main>`, but `<app-footer>` renders _after_ it — the clearance landed in the middle of the page                                                                            |
| 2   | Lightbox let the page scroll behind it on iOS; scroll position lost on close | `overflow: hidden` on `<body>` is ignored by iOS Safari. Replaced with `position: fixed` pinning + offset replay                                                                                 |
| 3   | `tv:` utilities emitted invalid CSS (`.tv\:py-5 (width >= 160rem)`)          | The one-line `@custom-variant` shorthand mis-parses a comma-separated media list. Rewritten in block form                                                                                        |
| 4   | Contacts page overflowed at every phone width (431px in a 320px viewport)    | `break-words` wraps visually but does **not** reduce min-content width, so the grid track stayed as wide as the e-mail address. Fixed with `wrap-anywhere` + `min-w-0`                           |
| 5   | Page could be dragged sideways after deploy                                  | Three `blur-3xl` glows positioned outside their containers, relying on `overflow: hidden` + `border-radius` to clip — a combination that leaks on iOS Safari. Replaced with background gradients |
| 6   | The responsive audit passed with a deliberate 200px overflow                 | Its probe honoured the root `overflow-x: clip` guard, so every element looked "clipped" and was skipped. The walk now stops before `<body>`                                                      |
| 7   | `class="mt-8"` on `<app-button>` silently did nothing                        | The host was `display: contents`, which generates no box: the margin was computed (32px) and discarded. Host is now a real box declared in the base layer                                        |
| 8   | Header CTA appeared on mobile after fixing #7                                | A static `inline-flex` host class ties in specificity with the caller's `hidden`, and stylesheet order decided. Moving the default display to the base layer makes any utility win               |

### 6.4 Decisions worth knowing

- **Angular 21, not 22.** Angular 22 requires Node ≥22.22.3; this machine runs
  22.14. Pinning to 21 was the compatible current release.
- **No SSR.** A four-page marketing site is well served by CSR plus complete meta
  tags and JSON-LD. Prerendering would improve first paint and is the natural
  next step, but it changes the deployment shape.
- **`clip` over `hidden`** for the overflow guard, so the sticky header survives.
- **Button shadows are not card shadows.** A card floats (wide, soft blur); a
  button sits on the surface (short blur + contact shadow). Reusing the card
  shadow left a diffuse smudge on the bone background; too much red in the brand
  shadow bloomed into a halo on the near-black header.
- **`verify` stays browser-free.** A gate that cannot run in a plain CI container
  is a gate that gets removed. The browser-dependent audit is `verify:full`.
- **Vehicle categories were kept at the original five.** An unused
  `autocaravanas` icon exists in the source assets, but advertising a service the
  client never claimed is a content decision, not a developer's.

### 6.5 How the work was verified

Claims in this repository were measured, not assumed:

- **Layout** — headless Chrome across 13 device profiles × 4 pages, measuring
  scroll width, element escape, root font size, container width, nav state and
  tap-target sizes.
- **Behaviour** — scroll lock exercised end-to-end with real wheel input, then
  asserted in a unit test.
- **The guards themselves** — the responsive audit was validated by injecting a
  deliberate 200px overflow and confirming it fails; `deploy.ps1` was parse-checked
  and every guard path exercised with `-WhatIf`, so nothing was ever published.
- **Tests catch real regressions** — `ui-button.spec.ts` failed on its first run,
  catching that an edit to `classes()` had silently not applied and `link` was
  still receiving pill padding.

### 6.6 Known limitations

Honest list of what is _not_ done:

- **No SSR or prerendering.** Search engines execute JS, but prerendered HTML
  would still be faster and more robust.
- **No contact form.** Deliberate — there is no backend. Contact is by phone,
  e-mail and Maps directions.
- **Google Fonts is an external dependency.** If it is slow or blocked, the
  fallback stack takes over. Layout is audited with fonts blocked, so nothing
  breaks; only the typeface changes. Self-hosting would remove the dependency.
- **Images are JPEG only.** AVIF/WebP would cut payload further.
- **Portuguese only.** No i18n scaffolding.
- **Analytics is off unless `.env` provides an ID.** GA4 is wired up and runs
  cookieless; without `GOOGLE_ANALYTICS_ID` it is completely inert (§2.5). The
  privacy notice (§2.6) informs and offers an opt-out.
- **No privacy policy page.** The notice says what is measured in two lines;
  there is no longer page for it to link to, and no "change your preference"
  affordance once a visitor has answered (`ConsentService.reset()` exists for
  when one is added).
- **No CI pipeline.** `verify` / `verify:full` are run manually; wiring them into
  GitHub Actions is the obvious next step.
