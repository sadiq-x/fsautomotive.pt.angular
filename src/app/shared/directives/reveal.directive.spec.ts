/**
 * The observer's lifetime is the whole point of these tests.
 *
 * `disconnect()` on intersection was always there; what was missing was the
 * teardown for an element destroyed *before* it ever scrolls into view, which
 * is the ordinary case on a long page someone leaves early.
 */
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RevealDirective } from './reveal.directive';

interface FakeObserver {
  readonly observed: Element[];
  disconnectCount: number;
  trigger(isIntersecting: boolean): void;
}

const observers: FakeObserver[] = [];

/** Records every instance so a test can inspect and drive it. */
class FakeIntersectionObserver implements FakeObserver {
  readonly observed: Element[] = [];
  disconnectCount = 0;

  constructor(private readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }

  observe(element: Element): void {
    this.observed.push(element);
  }

  disconnect(): void {
    this.disconnectCount++;
  }

  trigger(isIntersecting: boolean): void {
    const entries = this.observed.map((target) => ({ target, isIntersecting }));
    this.callback(entries as unknown as IntersectionObserverEntry[], this as never);
  }
}

@Component({
  imports: [RevealDirective],
  template: `<div appReveal [revealDelay]="delay">conteúdo</div>`,
})
class Host {
  delay = 0;
}

async function render(reducedMotion = false) {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }) as MediaQueryList);

  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();

  return fixture;
}

describe('RevealDirective', () => {
  beforeEach(() => {
    observers.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('observes the host element and marks it hidden', async () => {
    const fixture = await render();
    const element = fixture.nativeElement.querySelector('div') as HTMLElement;

    expect(observers).toHaveLength(1);
    expect(observers[0]?.observed).toEqual([element]);
    expect(element.classList.contains('reveal')).toBe(true);
  });

  it('reveals the element and disconnects once it intersects', async () => {
    const fixture = await render();
    const element = fixture.nativeElement.querySelector('div') as HTMLElement;

    observers[0]?.trigger(true);

    expect(element.classList.contains('reveal-visible')).toBe(true);
    expect(observers[0]?.disconnectCount).toBe(1);
  });

  it('stays hidden and connected while the element is out of view', async () => {
    const fixture = await render();
    const element = fixture.nativeElement.querySelector('div') as HTMLElement;

    observers[0]?.trigger(false);

    expect(element.classList.contains('reveal-visible')).toBe(false);
    expect(observers[0]?.disconnectCount).toBe(0);
  });

  it('disconnects on destroy even when the element never came into view', async () => {
    const fixture = await render();

    expect(observers[0]?.disconnectCount).toBe(0);

    fixture.destroy();

    expect(observers[0]?.disconnectCount).toBe(1);
  });

  it('observes nothing at all when the visitor prefers reduced motion', async () => {
    const fixture = await render(true);
    const element = fixture.nativeElement.querySelector('div') as HTMLElement;

    expect(observers).toHaveLength(0);
    expect(element.classList.contains('reveal')).toBe(false);
  });
});
