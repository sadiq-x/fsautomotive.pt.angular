import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from '../../../core/auth';
import { PRIVATE_ROUTES } from '../../../core/config/private-routes.config';
import { SITE } from '../../../core/data';
import { Icon } from '../../../shared/components/icon/icon';
import { PRIVATE_NAV, type PrivateNavItem } from './private-nav.data';
import { ToastHost } from './toast-host/toast-host';

/**
 * The frame every private page renders inside.
 *
 * WHY A SEPARATE SHELL RATHER THAN THE SITE HEADER
 * ------------------------------------------------
 * The public site is a brochure: a wide hero, a marketing nav, a footer with
 * opening hours. A management area is the opposite — dense, navigation-first,
 * and it should not look like somewhere a customer wandered into. Giving it its
 * own shell also keeps the public bundle unchanged: this component and
 * everything under it ship in the lazily loaded `/gestao` chunk.
 *
 * The brand still shows through — same tokens, same button, same icons — so it
 * reads as the same product, not a bolted-on admin panel.
 *
 * RESPONSIVE BEHAVIOUR
 * --------------------
 * The sidebar is permanent from `lg` up and an off-canvas drawer below it.
 * The drawer closes on navigation and on Escape, and the backdrop is a real
 * button so a screen reader can dismiss it too.
 */
@Component({
  selector: 'app-private-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ToastHost],
  templateUrl: './private-shell.html',
  host: {
    class: 'block min-h-dvh bg-bone-100',
    '(document:keydown.escape)': 'closeDrawer()',
    // A dropdown that only closes via its own button is a dead end for anyone
    // who clicks elsewhere first. The menu's own toggle stops propagation, so
    // this only ever fires for clicks outside it.
    '(document:click)': 'accountMenuOpen.set(false)',
  },
})
export class PrivateShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly site = SITE;
  protected readonly routes = PRIVATE_ROUTES;
  protected readonly user = this.auth.user;
  protected readonly initials = this.auth.initials;

  protected readonly drawerOpen = signal(false);
  protected readonly accountMenuOpen = signal(false);

  /** Only the destinations this user may actually open. */
  protected readonly navItems = computed<readonly PrivateNavItem[]>(() => {
    // Read as a signal so the list re-evaluates when the session changes.
    this.auth.user();

    return PRIVATE_NAV.filter(
      (item) => !item.permission || this.auth.hasPermission(item.permission),
    );
  });

  /** Names the current page in the mobile header, where the sidebar is hidden. */
  protected readonly currentTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const url = this.router.url.split('?')[0] ?? '';
        // Longest match wins, so `/gestao/marcacoes/nova` resolves to Marcações
        // rather than to the dashboard's `/gestao`.
        return (
          [...PRIVATE_NAV]
            .sort((a, b) => b.path.length - a.path.length)
            .find((item) => url.startsWith(item.path))?.label ?? 'Gestão'
        );
      }),
    ),
    { initialValue: 'Gestão' },
  );

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  protected toggleAccountMenu(event: Event): void {
    // Without this the document listener above would close the menu in the
    // same click that opened it.
    event.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }

  protected async signOut(): Promise<void> {
    this.closeDrawer();
    await this.auth.logout();
    await this.router.navigate([PRIVATE_ROUTES.login]);
  }
}
