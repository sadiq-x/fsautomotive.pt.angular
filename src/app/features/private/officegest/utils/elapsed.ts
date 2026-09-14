/**
 * Elapsed-time arithmetic, shared by everything that counts up on screen.
 *
 * WHY THE LOCAL CLOCK IS NEVER READ AS AN ABSOLUTE
 * ------------------------------------------------
 * These run on a workshop tablet and on whatever phone is in someone's pocket,
 * and a device whose clock is ten minutes out would otherwise show every timer
 * ten minutes wrong with nothing on screen to suggest it.
 *
 * So a duration is built from two halves, each measured where it can be trusted:
 *
 *   observedAt − startedAt    both server timestamps, from the same clock
 *   now − receivedAt          a *local* interval, measured against itself
 *
 * The browser's wall-clock reading never enters the sum. `receivedAt` is the
 * bridge: the local instant the server's snapshot arrived.
 *
 * Extracted here rather than left in `ElapsedTime` because the work-order page
 * needs the same sum for a job's total worked time, and a second copy of this
 * reasoning is a second chance to get one of the two halves backwards.
 */

/** Seconds elapsed since `startedAt`, or `null` when it cannot be computed. */
export function elapsedSeconds(
  startedAt: string | undefined,
  observedAt: string,
  receivedAt: number,
  now: number,
): number | null {
  if (!startedAt) {
    return null;
  }

  const started = Date.parse(startedAt);
  const observed = Date.parse(observedAt);

  if (Number.isNaN(started) || Number.isNaN(observed)) {
    return null;
  }

  // A clock-on marginally in the future — the ERP and the API a second apart —
  // reads as "just started" rather than as a timer counting backwards.
  return Math.max(0, Math.floor((observed - started + (now - receivedAt)) / 1000));
}

/**
 * `2h 05m` past the hour, `05m 30s` below it.
 *
 * The seconds go once there is an hour on the clock: nobody reading a board
 * across a workshop is counting them, and a field that changes every second
 * pulls the eye away from the ones that matter.
 */
export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0 ? `${hours}h ${pad(minutes)}m` : `${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * A span in whole days and hours: `150 dias`, `3 dias 4 h`, `5 h`.
 *
 * A different function from `formatElapsed` on purpose. That one is a stopwatch
 * and this one is an age — rendering "3624h 12m" for a job opened in April
 * would be arithmetically right and unreadable.
 */
export function formatSpan(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);

  if (days > 0) {
    const noun = days === 1 ? 'dia' : 'dias';

    // The hours are dropped past a week: nobody reads "84 dias 6 h" as more
    // precise, only as harder to scan.
    return days > 7 || hours === 0 ? `${days} ${noun}` : `${days} ${noun} ${hours} h`;
  }

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours} h ${pad(minutes)} min` : `${minutes} min`;
}

/** `2 h 00 min`, or `45 min`. Minutes in, a readable estimate out. */
export function formatMinutes(total: number): string {
  const rounded = Math.round(total);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  return hours > 0 ? `${hours} h ${pad(minutes)} min` : `${minutes} min`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
