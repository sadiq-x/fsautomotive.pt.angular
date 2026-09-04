import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { PRIVATE_BASE } from './core/config/private-routes.config';
import type { PageMeta } from './core/models';
import { AnalyticsService, SeoService, StructuredDataService } from './core/services';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { MobileTabBar } from './layout/mobile-tab-bar/mobile-tab-bar';
import { CookieNotice } from './shared/components/cookie-notice/cookie-notice';
import { Lightbox } from './shared/components/lightbox/lightbox';

/**
 * Application shell: the public chrome, the routed content, the single lightbox
 * instance and the privacy notice. It also keeps the document head in sync with
 * the active route's `data.meta`, and starts analytics (a no-op until a
 * Measurement ID is configured, or if the visitor opted out).
 *
 * WHY THE CHROME IS CONDITIONAL
 * -----------------------------
 * `/gestao` renders inside `PrivateShell`, which supplies its own sidebar,
 * header and `<main>`. Rendering the public header and footer around it too
 * would put two navigations, two landmarks and a tab bar linking back to the
 * brochure site on every management screen.
 *
 * The decision is made from the URL rather than from route data because it must
 * be correct on the *first* paint of a hard load — a flag read after the
 * initial navigation resolves would flash the public header first. `Location`
 * knows the current path before the router has navigated, and normalises the
 * base href, which `window.location.pathname` would not on GitHub Pages.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, MobileTabBar, Lightbox, CookieNotice],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly seo = inject(SeoService);
  private readonly structuredData = inject(StructuredDataService);
  private readonly analytics = inject(AnalyticsService);

  /** The deepest active route's `meta`, recomputed after every navigation. */
  private readonly activeMeta = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.deepestMeta()),
    ),
    { initialValue: undefined },
  );

  /** `false` for anything under `/gestao`, which brings its own frame. */
  protected readonly showPublicChrome = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => !isPrivatePath(this.location.path())),
    ),
    { initialValue: !isPrivatePath(this.location.path()) },
  );

  constructor() {
    this.structuredData.publishLocalBusiness();
    this.analytics.initialize();

    effect(() => {
      const meta = this.activeMeta();
      if (meta) {
        this.seo.apply(meta);
      }
    });
  }

  private deepestMeta(): PageMeta | undefined {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['meta'] as PageMeta | undefined;
  }
}

/**
 * Whether a path belongs to the private area.
 *
 * The `/` boundary matters: a future public route named `/gestaoxyz` must not
 * be mistaken for the management area and lose its header.
 */
export function isPrivatePath(path: string): boolean {
  const pathname = path.split('?')[0]?.split('#')[0] ?? '';
  return pathname === PRIVATE_BASE || pathname.startsWith(`${PRIVATE_BASE}/`);
}
