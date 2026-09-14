import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UiButton } from './ui-button';

@Component({
  imports: [UiButton],
  template: `
    <app-button class="mt-8" routerLink="/sobre-nos" variant="dark">Conhecer</app-button>
    <app-button [href]="'tel:+351933678865'" [external]="true">Ligar</app-button>
    <app-button (click)="clicked = true">Simples</app-button>
    <app-button [block]="true">Largo</app-button>
    <app-button variant="link" size="lg">Ligação</app-button>
  `,
})
class Host {
  clicked = false;
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const hosts = fixture.nativeElement.querySelectorAll('app-button') as NodeListOf<HTMLElement>;
  return { fixture, hosts };
}

describe('UiButton', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('renders a router link, a protocol anchor and a button as appropriate', () => {
    const { hosts } = render();

    const routed = hosts[0].firstElementChild as HTMLAnchorElement;
    expect(routed.tagName).toBe('A');
    expect(routed.getAttribute('href')).toBe('/sobre-nos');

    const external = hosts[1].firstElementChild as HTMLAnchorElement;
    expect(external.tagName).toBe('A');
    expect(external.getAttribute('href')).toBe('tel:+351933678865');
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');

    expect((hosts[2].firstElementChild as HTMLElement).tagName).toBe('BUTTON');
  });

  // The host used to be `display: contents`, which generates no box — layout
  // classes on it were computed and then silently dropped.
  it('keeps layout classes the caller puts on the host', () => {
    const { hosts } = render();
    expect(hosts[0].classList.contains('mt-8')).toBe(true);
  });

  // The default display lives in the base layer. A static display class here
  // would tie with a caller's `hidden` and be resolved by stylesheet order,
  // which is how the header CTA once leaked onto mobile.
  it('never sets a display utility on the host', () => {
    const { hosts } = render();
    for (const host of hosts) {
      for (const cls of ['contents', 'block', 'flex', 'inline-flex', 'hidden']) {
        expect(host.classList.contains(cls)).toBe(false);
      }
    }
  });

  it('stretches the host, not just the button, when block is set', () => {
    const { hosts } = render();
    expect(hosts[3].classList.contains('w-full')).toBe(true);
    expect(hosts[0].classList.contains('w-full')).toBe(false);
  });

  it('gives the link variant no pill padding', () => {
    const { hosts } = render();
    const link = hosts[4].firstElementChild as HTMLElement;
    expect(link.className).not.toMatch(/\bpx-\d/);
    expect(link.className).toContain('underline');
  });

  it('lets the rendered control fill a stretched host', () => {
    const { hosts } = render();
    expect((hosts[2].firstElementChild as HTMLElement).className).toContain('w-full');
  });
});

/**
 * The busy state.
 *
 * This is the design system's answer to "something is loading", and every
 * refresh control in the private area depends on it. Before it existed, three
 * pages hand-rolled a raw button with the pill's utility classes copied out,
 * purely to get a spinning icon.
 */
describe('UiButton loading', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  function setup(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(UiButton);

    for (const [key, value] of Object.entries({ icon: 'refresh', ...inputs })) {
      fixture.componentRef.setInput(key, value);
    }

    fixture.detectChanges();

    return fixture;
  }

  const button = (fixture: ReturnType<typeof setup>) =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  const icon = (fixture: ReturnType<typeof setup>) =>
    fixture.nativeElement.querySelector('app-icon') as HTMLElement;

  it('does not spin or disable when idle', () => {
    const fixture = setup();

    expect(icon(fixture).className).not.toContain('animate-spin');
    expect(button(fixture).disabled).toBe(false);
    expect(button(fixture).getAttribute('aria-busy')).toBeNull();
  });

  it('turns the icon while loading', () => {
    expect(icon(setup({ loading: true })).className).toContain('animate-spin');
  });

  /**
   * Loading implies disabled, so no caller has to bind both — and a refresh
   * already in flight has nothing to do with a second press.
   */
  it('stops accepting presses while loading', () => {
    expect(button(setup({ loading: true })).disabled).toBe(true);
  });

  it('announces that it is busy', () => {
    expect(button(setup({ loading: true })).getAttribute('aria-busy')).toBe('true');
  });

  /** Disabled is not busy: the icon must not imply work is happening. */
  it('disables without spinning when disabled for its own reasons', () => {
    expect(button(setup({ disabled: true })).disabled).toBe(true);
    expect(icon(setup({ disabled: true })).className).not.toContain('animate-spin');
  });

  /** A glyph both turning and sliding reads as a glitch rather than progress. */
  it('suppresses the hover nudge on a right-hand icon while loading', () => {
    const fixture = setup({ loading: true, iconPosition: 'right' });

    expect(icon(fixture).className).toContain('animate-spin');
    expect(icon(fixture).className).not.toContain('group-hover/btn:translate-x-0.5');
  });
});
