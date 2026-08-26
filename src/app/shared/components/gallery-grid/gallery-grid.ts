import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import type { GalleryImage } from '../../../core/models';
import { Icon } from '../icon/icon';
import { LightboxService } from '../lightbox/lightbox.service';

/**
 * Responsive photo grid. Every tile is a button that hands the whole collection
 * to `LightboxService`, so the viewer can be navigated from any starting point.
 */
@Component({
  selector: 'app-gallery-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './gallery-grid.html',
  host: { class: 'block' },
})
export class GalleryGrid {
  readonly images = input.required<readonly GalleryImage[]>();
  readonly columns = input<2 | 3>(3);

  private readonly lightbox = inject(LightboxService);

  protected openAt(index: number): void {
    this.lightbox.open(this.images(), index);
  }
}
