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
        │   ├── models/          10 interfaces + barrel
        │   ├── data/            7 content files + barrel
        │   └── services/        SeoService, StructuredDataService
        ├── layout/              header, footer, mobile-tab-bar
        ├── shared/
        │   ├── components/      16 reusable components
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
npm test           # single run  — currently 7 files, 39 tests
npm run test:watch # re-runs on change
```

### 3.5 Build for production

```bash
npm run build      # → dist/fsautomotive/browser
```

Current output — initial payload **91.16 kB gzipped**:

| Bundle        | Raw               | Gzip         |
| ------------- | ----------------- | ------------ |
| Initial total | 352.11 kB         | 91.16 kB     |
| ├ framework   | 279.87 kB         | 77.73 kB     |
| ├ styles      | 56.94 kB          | 8.48 kB      |
| └ main        | 15.31 kB          | 4.95 kB      |
| Lazy routes   | 1.89–7.68 kB each | 0.95–2.75 kB |

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

7 spec files, 39 tests. They target logic that is easy to break silently:

| Spec                       | Guards                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `content.spec.ts`          | Unique ids, icons that exist in the registry, nav links that match real routes, paired opening/closing times, a dialable phone href |
| `seo.service.spec.ts`      | Title, meta and canonical tags per route                                                                                            |
| `accordion-state.spec.ts`  | Single vs multiple open, toggle, close-all                                                                                          |
| `lightbox.service.spec.ts` | Open/close, next/previous wrap-around                                                                                               |
| `lightbox.spec.ts`         | Scroll lock pins and restores the exact offset                                                                                      |
| `responsive-image.spec.ts` | `srcset` derivation, intrinsic size, lazy vs priority                                                                               |
| `ui-button.spec.ts`        | Element polymorphism, host-class contract, `link` has no pill padding                                                               |

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

### 5.3 Adding a script

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
- **No analytics or cookie banner.** Nothing is tracked, so no consent UI is
  needed — revisit if analytics are added.
- **No CI pipeline.** `verify` / `verify:full` are run manually; wiring them into
  GitHub Actions is the obvious next step.
