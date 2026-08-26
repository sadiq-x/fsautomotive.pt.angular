import { Injectable, computed, signal } from '@angular/core';

import type { GalleryImage } from '../../../core/models';

/**
 * App-wide image viewer state. Any gallery calls `open(...)`; a single
 * `<app-lightbox />` mounted in the shell does the rendering, so the overlay
 * markup exists exactly once.
 */
@Injectable({ providedIn: 'root' })
export class LightboxService {
  private readonly images = signal<readonly GalleryImage[]>([]);
  private readonly index = signal(0);

  readonly isOpen = signal(false);
  readonly current = computed<GalleryImage | null>(() => this.images()[this.index()] ?? null);
  readonly total = computed(() => this.images().length);
  readonly position = computed(() => this.index() + 1);

  open(images: readonly GalleryImage[], startIndex = 0): void {
    if (images.length === 0) {
      return;
    }
    this.images.set(images);
    this.index.set(Math.min(Math.max(startIndex, 0), images.length - 1));
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  next(): void {
    this.index.update((i) => (i + 1) % this.total());
  }

  previous(): void {
    this.index.update((i) => (i - 1 + this.total()) % this.total());
  }
}
