/**
 * The elapsed-time arithmetic every counter on screen is built from.
 *
 * The property that matters is that a device with a wrong clock still shows a
 * right duration, so every case here sets the local clock away from the
 * server's. An implementation doing `Date.now() - startedAt` passes a test
 * written with both clocks agreeing and fails all of these.
 */
import { elapsedSeconds, formatElapsed, formatMinutes, formatSpan } from './elapsed';

const OBSERVED_AT = '2026-09-13T10:00:00.000Z';
const OBSERVED_MS = Date.parse(OBSERVED_AT);

/** The browser believes it is an hour later than the server does. */
const RECEIVED_AT = OBSERVED_MS + 60 * 60 * 1000;

describe('elapsedSeconds', () => {
  it('counts from the clock-on to the snapshot, ignoring the local clock', () => {
    // Started 5m30s before the server took the snapshot; asked for at the
    // instant it arrived.
    const seconds = elapsedSeconds(
      '2026-09-13T09:54:30.000Z',
      OBSERVED_AT,
      RECEIVED_AT,
      RECEIVED_AT,
    );

    expect(seconds).toBe(330);
  });

  it('adds only the local interval since the snapshot arrived', () => {
    const seconds = elapsedSeconds(
      '2026-09-13T09:54:30.000Z',
      OBSERVED_AT,
      RECEIVED_AT,
      RECEIVED_AT + 10_000,
    );

    expect(seconds).toBe(340);
  });

  it('is null without a clock-on', () => {
    expect(elapsedSeconds(undefined, OBSERVED_AT, RECEIVED_AT, RECEIVED_AT)).toBeNull();
  });

  it('is null when a timestamp cannot be parsed', () => {
    expect(elapsedSeconds('not a date', OBSERVED_AT, RECEIVED_AT, RECEIVED_AT)).toBeNull();
    expect(elapsedSeconds(OBSERVED_AT, 'not a date', RECEIVED_AT, RECEIVED_AT)).toBeNull();
  });

  /** The ERP and the API can disagree by a second; that is not a negative timer. */
  it('floors a clock-on in the future at zero', () => {
    const seconds = elapsedSeconds(
      '2026-09-13T10:00:05.000Z',
      OBSERVED_AT,
      RECEIVED_AT,
      RECEIVED_AT,
    );

    expect(seconds).toBe(0);
  });
});

describe('formatElapsed', () => {
  it.each([
    [0, '00m 00s'],
    [330, '05m 30s'],
    [3599, '59m 59s'],
    // The seconds go once there is an hour on the clock.
    [3600, '1h 00m'],
    [7530, '2h 05m'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(formatElapsed(seconds)).toBe(expected);
  });
});

describe('formatSpan', () => {
  it.each([
    [90, '1 min'],
    [3600, '1 h 00 min'],
    [3600 * 5 + 60 * 30, '5 h 30 min'],
    [86_400, '1 dia'],
    [86_400 * 3 + 3600 * 4, '3 dias 4 h'],
    // Past a week the hours stop adding precision and start adding noise.
    [86_400 * 150 + 3600 * 6, '150 dias'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(formatSpan(seconds)).toBe(expected);
  });

  /** An age is not a stopwatch: a job opened in April must not read "3624h". */
  it('does not render a long span in hours', () => {
    expect(formatSpan(86_400 * 150)).not.toContain('h');
  });
});

describe('formatMinutes', () => {
  it.each([
    [30, '30 min'],
    [60, '1 h 00 min'],
    [120, '2 h 00 min'],
    [90, '1 h 30 min'],
  ])('renders %i minutes as %s', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});
