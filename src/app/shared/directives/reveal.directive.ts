import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Fades an element in the first time it scrolls into view.
 *
 * Degrades safely: if `IntersectionObserver` is unavailable or the visitor
 * prefers reduced motion, the element is simply shown — the hidden state is
 * only ever applied once we know we can remove it again.
 *
 * @example <div appReveal [revealDelay]="150">…</div>
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective {
  /** Stagger in milliseconds, for lists that should cascade in. */
  readonly revealDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.observe());
  }

  private observe(): void {
    const element = this.host.nativeElement;
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      return;
    }

    element.classList.add('reveal');

    if (this.revealDelay() > 0) {
      element.style.transitionDelay = `${this.revealDelay()}ms`;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.classList.add('reveal-visible');
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(element);

    // Disconnecting in the callback above only covers elements that are
    // actually reached. Leaving a page before scrolling to the bottom is the
    // ordinary case — the public pages carry twenty of these — and every
    // element still above the fold would otherwise leave a live observer
    // holding its now-detached node for the lifetime of the tab.
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
