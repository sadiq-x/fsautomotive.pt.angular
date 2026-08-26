import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { IconName } from '../../../core/models';
import { ICON_SHAPES } from './icon-paths';

/**
 * The single way to render an icon anywhere on the site.
 *
 * Icons inherit `color` from their parent and are decorative by default; pass
 * `label` when the icon is the only thing conveying meaning.
 *
 * @example
 * <app-icon name="phone" [size]="20" />
 * <app-icon name="facebook" label="Facebook" />
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Edge length in pixels; icons are square. */
  readonly size = input(24);
  readonly strokeWidth = input(1.75);
  /** Accessible name. When omitted the icon is hidden from assistive tech. */
  readonly label = input<string | null>(null);

  protected readonly shapes = computed(() => ICON_SHAPES[this.name()]);
  protected readonly decorative = computed(() => this.label() === null);
}
