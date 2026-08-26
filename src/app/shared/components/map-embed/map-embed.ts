import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

import { SITE } from '../../../core/data';

/**
 * Google Maps embed for the workshop.
 *
 * The URL is a build-time constant from `SITE`, never user input, so trusting
 * it as a resource URL is safe. Loaded lazily to keep it off the critical path.
 */
@Component({
  selector: 'app-map-embed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map-embed.html',
  host: { class: 'block' },
})
export class MapEmbed {
  readonly title = input('Localização da FS Automotive no Google Maps');
  /** Any Tailwind aspect/height utilities for the frame wrapper. */
  readonly frameClass = input('aspect-[4/3] sm:aspect-[16/10]');

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly embedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    SITE.address.embedUrl,
  );
}
