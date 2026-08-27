import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConsentService } from '../../../core/services/consent.service';
import { CookieNotice } from './cookie-notice';

function render() {
  const fixture = TestBed.createComponent(CookieNotice);
  fixture.detectChanges();
  return fixture;
}

function buttonLabelled(fixture: ReturnType<typeof render>, label: string): HTMLButtonElement {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
  );
  const match = buttons.find((button) => button.textContent?.trim() === label);
  if (!match) {
    throw new Error(`No button labelled "${label}"`);
  }
  return match;
}

describe('CookieNotice', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => localStorage.clear());

  it('shows while the visitor has not decided', () => {
    const fixture = render();

    const region = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.getAttribute('aria-label')).toBe('Aviso de privacidade');
  });

  it('offers both a refusal and an acceptance', () => {
    const fixture = render();

    expect(buttonLabelled(fixture, 'Recusar')).toBeTruthy();
    expect(buttonLabelled(fixture, 'Aceitar')).toBeTruthy();
  });

  it('says what actually happens — no cookies, nothing identifying', () => {
    const text = render().nativeElement.textContent as string;

    expect(text).toContain('anónima');
    expect(text).toContain('Não utilizamos cookies');
  });

  it('disappears once accepted, and stays gone on the next visit', () => {
    const fixture = render();
    buttonLabelled(fixture, 'Aceitar').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="region"]')).toBeNull();
    expect(TestBed.inject(ConsentService).analyticsAllowed()).toBe(true);
    expect(render().nativeElement.querySelector('[role="region"]')).toBeNull();
  });

  it('disappears once refused, and opts the visitor out', () => {
    const fixture = render();
    buttonLabelled(fixture, 'Recusar').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="region"]')).toBeNull();
    expect(TestBed.inject(ConsentService).analyticsAllowed()).toBe(false);
  });

  it('renders nothing at all once a decision exists', () => {
    TestBed.inject(ConsentService).accept();

    expect(render().nativeElement.querySelector('[role="region"]')).toBeNull();
  });

  // It informs; it does not block. Trapping focus to announce that nobody is
  // being tracked would cost more than the message is worth.
  it('is not a modal', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-modal="true"]')).toBeNull();
  });
});
