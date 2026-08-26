import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import type { PageMeta } from './core/models';
import { SeoService, StructuredDataService } from './core/services';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { MobileTabBar } from './layout/mobile-tab-bar/mobile-tab-bar';
import { Lightbox } from './shared/components/lightbox/lightbox';

/**
 * Application shell: header, routed content, footer, mobile tab bar and the
 * single lightbox instance. It also keeps the document head in sync with the
 * active route's `data.meta`.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, MobileTabBar, Lightbox],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly structuredData = inject(StructuredDataService);

  /** The deepest active route's `meta`, recomputed after every navigation. */
  private readonly activeMeta = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.deepestMeta()),
    ),
    { initialValue: undefined },
  );

  constructor() {
    this.structuredData.publishLocalBusiness();

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
