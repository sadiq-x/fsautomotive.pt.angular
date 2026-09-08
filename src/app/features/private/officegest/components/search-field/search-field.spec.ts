/**
 * The shared search box.
 *
 * The first test here is the important one, and it looks odd out of context:
 * it asserts an input's `type` attribute. That attribute is what caused every
 * search box in the private area to display the literal text "[object Event]"
 * after the user pressed Enter.
 *
 * The mechanism, in full: this component's output is called `search`, and
 * `search` is also a native DOM event that Chrome fires on an
 * `<input type="search">` when Enter is pressed. It bubbles, so it left the
 * component and arrived at the consumer's `(search)="…$event…"` binding as a
 * raw `Event` — never passing through any handler here. The consumer stored it
 * as the search term, and the term is bound straight back to this field's
 * value, so the box filled with the stringified Event.
 *
 * The rest pin the value contract: whatever leaves this component is a string.
 */
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SearchField } from './search-field';

@Component({
  imports: [SearchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-search-field
    label="Pesquisar"
    [value]="term"
    (search)="received.push($event)"
  />`,
})
class Host {
  term = '';
  readonly received: unknown[] = [];
}

function render() {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();

  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

  function type(value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function pressEnter(): void {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
  }

  return { fixture, input, type, pressEnter, received: fixture.componentInstance.received };
}

describe('SearchField', () => {
  /**
   * Changing this back to `type="search"` reintroduces the "[object Event]"
   * bug in every list page at once, and no other test would catch it: jsdom
   * never fires the native event on its own, so the suite would stay green
   * while the browser broke.
   */
  it('does not use an input type that fires a native event named after its output', () => {
    const { input } = render();

    expect(input.type).not.toBe('search');
  });

  it('keeps the searchbox role the search type would have given it', () => {
    const { input } = render();

    expect(input.getAttribute('role')).toBe('searchbox');
  });

  it('emits the typed term as a string when Enter is pressed', () => {
    const { type, pressEnter, received } = render();

    type('  Ana Silva  ');
    pressEnter();

    expect(received).toEqual(['Ana Silva']);
  });

  it('emits a string, never an object, whatever the interaction', () => {
    const { type, pressEnter, received } = render();

    type('ana');
    pressEnter();
    pressEnter();
    type('');
    pressEnter();

    expect(received.every((value) => typeof value === 'string')).toBe(true);
  });

  /** A single character would be rejected by the backend with a 422. */
  it('holds back a term below the backend minimum', () => {
    const { type, pressEnter, received } = render();

    type('a');
    pressEnter();

    expect(received).toEqual([]);
  });

  it('emits an empty term immediately when cleared', () => {
    const { fixture, type, received } = render();

    type('ana');
    const clear = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    expect(received.at(-1)).toBe('');
  });
});
