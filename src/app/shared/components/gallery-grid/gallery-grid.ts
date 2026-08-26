import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import type { GalleryImage } from '../../../core/models';
import { Icon } from '../icon/icon';
import { LightboxService } from '../lightbox/lightbox.service';
import { ResponsiveImage } from '../responsive-image/responsive-image';

/**
 * Responsive photo grid. Every tile is a button that hands the whole collection
 * to `LightboxService`, so the viewer can be navigated from any starting point.
 */
@Component({
  selector: 'app-gallery-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ResponsiveImage],
  templateUrl: './gallery-grid.html',
  host: { class: 'block' },
})
export class GalleryGrid {
  readonly images = input.required<readonly GalleryImage[]>();
  readonly columns = input<2 | 3>(3);

  private readonly lightbox = inject(LightboxService);

  /**
   * Slot width per breakpoint. A two-column grid sits inside a ~58vw page
   * column on large screens, so each tile lands near 28vw there.
   */
  protected readonly sizes = computed(() =>
    this.columns() === 2
      ? '(min-width: 64rem) 28vw, (min-width: 40rem) 46vw, 92vw'
      : '(min-width: 64rem) 30vw, (min-width: 40rem) 46vw, 92vw',
  );

  protected openAt(index: number): void {
    this.lightbox.open(this.images(), index);
  }
}
