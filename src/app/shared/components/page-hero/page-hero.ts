import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * The dark banner that opens every inner page: eyebrow, `<h1>` and lead text
 * over the brand's diagonal texture.
 */
@Component({
  selector: 'app-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './page-hero.html',
  host: { class: 'block' },
})
export class PageHero {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input<string | null>(null);
}
