import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NAV_LINKS } from '../../core/data';
import { Icon } from '../../shared/components/icon/icon';

/**
 * Fixed bottom navigation for phones and tablets — the thumb-reachable
 * equivalent of the desktop header nav, driven by the same `NAV_LINKS` data.
 */
@Component({
  selector: 'app-mobile-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './mobile-tab-bar.html',
  host: { class: 'md:hidden' },
})
export class MobileTabBar {
  protected readonly links = NAV_LINKS;
}
