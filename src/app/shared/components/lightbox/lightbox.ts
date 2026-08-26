import { ChangeDetectionStrategy, Component, DOCUMENT, effect, inject } from '@angular/core';

import { Icon } from '../icon/icon';
import { ResponsiveImage } from '../responsive-image/responsive-image';
import { LightboxService } from './lightbox.service';

/**
 * Full-screen image viewer. Mounted once by the app shell.
 *
 * Pins the page while open (see `lock`), closes on Escape or backdrop click,
 * and restores both focus and scroll position to where the visitor was.
 */
@Component({
  selector: 'app-lightbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ResponsiveImage],
  templateUrl: './lightbox.html',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class Lightbox {
  private readonly document = inject(DOCUMENT);
  private lastFocused: HTMLElement | null = null;
  private scrollY = 0;
  private locked = false;

  protected readonly lightbox = inject(LightboxService);

  constructor() {
    effect(() => {
      const open = this.lightbox.isOpen();

      if (open && !this.locked) {
        this.lock();
      } else if (!open && this.locked) {
        this.unlock();
      }
    });
  }

  /**
   * Locks background scrolling.
   *
   * `overflow: hidden` on `<body>` is not enough — iOS Safari keeps scrolling
   * the page behind the overlay. Pinning the body with `position: fixed` at a
   * negative offset is the technique that holds everywhere; the offset is
   * replayed on unlock so the visitor returns to exactly where they were.
   */
  private lock(): void {
    const body = this.document.body;

    this.lastFocused = this.document.activeElement as HTMLElement | null;
    this.scrollY = globalThis.scrollY;

    body.style.position = 'fixed';
    body.style.top = `-${this.scrollY}px`;
    body.style.insetInline = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    this.locked = true;
  }

  private unlock(): void {
    const body = this.document.body;

    for (const property of ['position', 'top', 'inset-inline', 'width', 'overflow']) {
      body.style.removeProperty(property);
    }

    globalThis.scrollTo({ top: this.scrollY, behavior: 'instant' as ScrollBehavior });
    this.locked = false;

    this.lastFocused?.focus?.();
    this.lastFocused = null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.lightbox.isOpen()) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.lightbox.close();
        break;
      case 'ArrowRight':
        this.lightbox.next();
        break;
      case 'ArrowLeft':
        this.lightbox.previous();
        break;
      default:
        return;
    }
    event.preventDefault();
  }
}
