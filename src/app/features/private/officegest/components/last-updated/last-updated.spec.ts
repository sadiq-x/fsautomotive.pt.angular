/**
 * The freshness indicator.
 *
 * The interesting property is that it changes on its own: a page left open must
 * turn amber and then red without anything re-fetching. That is what the fake
 * timers below exercise — asserting the colour right after a fetch would prove
 * nothing that reading the code does not.
 */
import { TestBed } from '@angular/core/testing';

import { LastUpdated } from './last-updated';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function setup(since: Date | null) {
  const fixture = TestBed.createComponent(LastUpdated);
  fixture.componentRef.setInput('since', since);
  fixture.detectChanges();

  return fixture;
}

/** The dot's colour class, which is what the whole component exists to set. */
function dotClass(fixture: ReturnType<typeof setup>): string {
  return (
    (fixture.nativeElement.querySelector('span[aria-hidden]') as HTMLElement | null)?.className ??
    ''
  );
}

function text(fixture: ReturnType<typeof setup>): string {
  return (fixture.nativeElement.textContent as string).trim();
}

describe('LastUpdated', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders nothing before the first response', () => {
    const fixture = setup(null);

    expect(text(fixture)).toBe('');
  });

  it('is green just after a fetch', () => {
    const fixture = setup(new Date());

    expect(dotClass(fixture)).toContain('bg-emerald-500');
    expect(text(fixture)).toContain('agora mesmo');
  });

  it.each([
    ['green under an hour', 59 * MINUTE, 'bg-emerald-500'],
    ['amber past an hour', 61 * MINUTE, 'bg-amber-500'],
    ['amber under four hours', 3 * HOUR, 'bg-amber-500'],
    ['red past four hours', 5 * HOUR, 'bg-red-500'],
  ])('goes %s', (_label, age, expected) => {
    const fixture = setup(new Date(Date.now() - age));

    expect(dotClass(fixture)).toContain(expected);
  });

  /**
   * The property that makes this component worth having: nobody has to touch
   * the page for it to stop claiming the data is fresh.
   */
  it('turns amber on its own as time passes, with no new input', () => {
    const fixture = setup(new Date());
    expect(dotClass(fixture)).toContain('bg-emerald-500');

    vi.advanceTimersByTime(61 * MINUTE);
    fixture.detectChanges();

    expect(dotClass(fixture)).toContain('bg-amber-500');
  });

  it('goes back to green when the data is refreshed', () => {
    const fixture = setup(new Date(Date.now() - 5 * HOUR));
    expect(dotClass(fixture)).toContain('bg-red-500');

    fixture.componentRef.setInput('since', new Date());
    fixture.detectChanges();

    expect(dotClass(fixture)).toContain('bg-emerald-500');
  });

  it('counts minutes while they are useful and switches to a clock time after', () => {
    const recent = setup(new Date(Date.now() - 5 * MINUTE));
    expect(text(recent)).toContain('há 5 minutos');

    const older = setup(new Date(Date.now() - 3 * HOUR));
    expect(text(older)).toContain('Atualizado às');
  });

  /** A clock adjustment must not produce "há -3 minutos". */
  it('treats a timestamp in the future as just now', () => {
    const fixture = setup(new Date(Date.now() + 10 * MINUTE));

    expect(text(fixture)).toContain('agora mesmo');
    expect(dotClass(fixture)).toContain('bg-emerald-500');
  });

  /** A leaked interval would keep the zone busy for the rest of the suite. */
  it('stops its ticker when destroyed', () => {
    const fixture = setup(new Date());

    fixture.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});
