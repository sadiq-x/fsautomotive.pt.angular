import { DOCUMENT, effect, inject } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../icon/icon';
import { LightboxService } from './lightbox.service';

/**
 * Full-screen image viewer. Mounted once by the app shell.
 *
 * Locks body scroll while open, closes on Escape or backdrop click, and
 * restores focus to whatever opened it.
 */
@Component({
  selector: 'app-lightbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './lightbox.html',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class Lightbox {
  private readonly document = inject(DOCUMENT);
  private lastFocused: HTMLElement | null = null;

  protected readonly lightbox = inject(LightboxService);

  constructor() {
    effect(() => {
      const open = this.lightbox.isOpen();
      const body = this.document.body;

      if (open) {
        this.lastFocused = this.document.activeElement as HTMLElement | null;
        body.style.overflow = 'hidden';
      } else {
        body.style.removeProperty('overflow');
        this.lastFocused?.focus?.();
        this.lastFocused = null;
      }
    });
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
