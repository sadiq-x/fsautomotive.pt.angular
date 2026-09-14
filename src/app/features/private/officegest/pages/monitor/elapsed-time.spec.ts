/**
 * The running timer.
 *
 * The property worth pinning is the one that is easy to get wrong and invisible
 * when it is: the count must be right on a device whose clock is wrong. Every
 * test here sets the browser's clock to a different time from the server's, so
 * an implementation that quietly did `Date.now() - startedAt` would fail them
 * all — and would have passed a test written with both clocks in agreement.
 */
import { TestBed } from '@angular/core/testing';

import { ElapsedTime } from './elapsed-time';

/** The server's reading of "now" for this snapshot. */
const OBSERVED_AT = '2026-09-13T10:00:00.000Z';

/** The browser is a full hour ahead of the server in every test below. */
const BROWSER_SKEW_MS = 60 * 60 * 1000;

function setup(startedAt: string | undefined) {
  // `receivedAt` is a local reading, so it must come from the local clock —
  // that is precisely the value the component measures forward from.
  const receivedAt = Date.now();

  const fixture = TestBed.createComponent(ElapsedTime);
  fixture.componentRef.setInput('startedAt', startedAt);
  fixture.componentRef.setInput('observedAt', OBSERVED_AT);
  fixture.componentRef.setInput('receivedAt', receivedAt);
  fixture.detectChanges();

  return fixture;
}

function text(fixture: ReturnType<typeof setup>): string {
  return (fixture.nativeElement.textContent as string).trim();
}

describe('ElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // A browser an hour ahead of the server. If the component trusted this
    // clock as an absolute reading, every expectation below would be an hour out.
    vi.setSystemTime(new Date(Date.parse(OBSERVED_AT) + BROWSER_SKEW_MS));
  });

  afterEach(() => vi.useRealTimers());

  it('renders nothing when the mechanic has not clocked on', () => {
    expect(text(setup(undefined))).toBe('');
  });

  it('shows the time already worked at the moment of the snapshot', () => {
    // Clocked on 5m30s before the server took the snapshot.
    const fixture = setup('2026-09-13T09:54:30.000Z');

    expect(text(fixture)).toBe('05m 30s');
  });

  it('counts up on its own between polls', () => {
    const fixture = setup('2026-09-13T09:54:30.000Z');

    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();

    expect(text(fixture)).toBe('05m 40s');
  });

  /** Past an hour the seconds are noise on a board read across the workshop. */
  it('drops the seconds once there is an hour on the clock', () => {
    const fixture = setup('2026-09-13T07:55:00.000Z');

    expect(text(fixture)).toBe('2h 05m');
  });

  /**
   * The server and the ERP can be a second apart, which would otherwise render
   * as a timer counting backwards from a negative number.
   */
  it('reads a clock-on marginally in the future as just started', () => {
    const fixture = setup('2026-09-13T10:00:05.000Z');

    expect(text(fixture)).toBe('00m 00s');
  });

  it('publishes a machine-readable duration', () => {
    const fixture = setup('2026-09-13T09:54:30.000Z');
    const time = fixture.nativeElement.querySelector('time') as HTMLElement;

    expect(time.getAttribute('datetime')).toBe('PT0H5M30S');
  });

  it('renders nothing when the timestamps are unusable', () => {
    expect(text(setup('not a date'))).toBe('');
  });
});
