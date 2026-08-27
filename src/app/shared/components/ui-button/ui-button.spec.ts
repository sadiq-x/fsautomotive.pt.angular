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
