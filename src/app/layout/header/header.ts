import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NAV_LINKS, SITE } from '../../core/data';
import { Icon } from '../../shared/components/icon/icon';
import { UiButton } from '../../shared/components/ui-button/ui-button';

/**
 * Desktop header: logo, primary navigation and the call-us button.
 * It sticks to the top and gains a shadow once the page is scrolled.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon, UiButton],
  templateUrl: './header.html',
  host: {
    class: 'sticky top-0 z-50 block',
    '(window:scroll)': 'onScroll()',
  },
})
export class Header {
  protected readonly site = SITE;
  protected readonly links = NAV_LINKS;
  protected readonly scrolled = signal(false);

  protected readonly barClasses = computed(() =>
    [
      'border-b border-white/5 bg-ink-950/95 backdrop-blur-md py-1 transition-shadow duration-300 tv:py-5',
      this.scrolled() ? 'shadow-lg shadow-ink-950/25' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected onScroll(): void {
    this.scrolled.set(globalThis.scrollY > 8);
  }
}
