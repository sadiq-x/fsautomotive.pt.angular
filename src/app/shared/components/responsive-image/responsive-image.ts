import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { GalleryImage } from '../../../core/models';

/**
 * Renders a photo at the smallest rendition that still covers the slot it is
 * drawn into, so a phone never downloads a 1920px original.
 *
 * The `srcset` is derived from `image.widths` by convention
 * (`oficina-1.jpg` → `oficina-1-480.jpg`), which keeps the content data free of
 * generated file names.
 *
 * @example
 * <app-responsive-image [image]="photo" sizes="(min-width: 64rem) 33vw, 100vw" />
 */
@Component({
  selector: 'app-responsive-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './responsive-image.html',
  host: { class: 'contents' },
})
export class ResponsiveImage {
  readonly image = input.required<GalleryImage>();
  /** Slot width per breakpoint — tells the browser which rendition to pick. */
  readonly sizes = input('100vw');
  readonly imgClass = input('');
  /** LCP-critical images are fetched eagerly at high priority. */
  readonly priority = input(false);

  protected readonly srcset = computed(() => {
    const { src, widths, width } = this.image();
    if (!widths?.length) {
      return null;
    }

    const dot = src.lastIndexOf('.');
    const base = src.slice(0, dot);
    const extension = src.slice(dot);

    return [...widths.map((w) => `${base}-${w}${extension} ${w}w`), `${src} ${width}w`].join(', ');
  });
}
