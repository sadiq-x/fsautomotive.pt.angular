import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import type { GalleryImage } from '../../../core/models';
import { Icon } from '../icon/icon';
import { ResponsiveImage } from '../responsive-image/responsive-image';

/**
 * Auto-advancing image carousel used by the home hero.
 *
 * Autoplay pauses on hover, on keyboard focus, while the tab is hidden and when
 * the visitor prefers reduced motion. Slides are exposed as a labelled group so
 * screen readers can step through them.
 */
@Component({
  selector: 'app-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ResponsiveImage],
  templateUrl: './carousel.html',
  host: { class: 'block' },
})
export class Carousel {
  readonly slides = input.required<readonly GalleryImage[]>();
  /** Milliseconds between automatic transitions. */
  readonly interval = input(5000);
  readonly autoplay = input(true);
  readonly showControls = input(true);
  readonly showCaptions = input(false);
  /** Marks the first slide as LCP-critical so it is fetched eagerly. */
  readonly eager = input(true);

  private readonly destroyRef = inject(DestroyRef);
  private readonly paused = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly current = signal(0);
  protected readonly count = computed(() => this.slides().length);
  protected readonly trackStyle = computed(() => `translate3d(-${this.current() * 100}%, 0, 0)`);

  constructor() {
    afterNextRender(() => this.start());
    this.destroyRef.onDestroy(() => this.stop());
  }

  protected goTo(index: number): void {
    const total = this.count();
    if (total === 0) {
      return;
    }
    this.current.set((index + total) % total);
    this.restart();
  }

  protected next(): void {
    this.goTo(this.current() + 1);
  }

  protected previous(): void {
    this.goTo(this.current() - 1);
  }

  protected pause(): void {
    this.paused.set(true);
    this.stop();
  }

  protected resume(): void {
    this.paused.set(false);
    this.start();
  }

  private start(): void {
    if (this.timer !== null || this.paused() || !this.autoplay() || this.count() < 2) {
      return;
    }

    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.current.update((index) => (index + 1) % this.count());
      }
    }, this.interval());
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private restart(): void {
    this.stop();
    this.start();
  }
}
