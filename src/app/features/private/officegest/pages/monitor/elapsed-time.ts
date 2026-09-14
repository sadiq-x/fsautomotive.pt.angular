import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { elapsedSeconds, formatElapsed } from '../../utils/elapsed';

/**
 * How long a mechanic has been on a job, counting up on its own.
 *
 * WHY THE CLOCK IS NOT THE BROWSER'S
 * ----------------------------------
 * The obvious implementation — `Date.now() - startedAt` — is wrong on any
 * machine whose clock is off, and the machines this runs on are a shop tablet
 * and whatever phone is in someone's pocket. A device ten minutes fast would
 * show every mechanic as having worked ten minutes longer than they have, with
 * nothing on screen to suggest the number is nonsense.
 *
 * So nothing here trusts the local clock as an *absolute* reading. The server
 * sends `observedAt` — its own "now" at the moment it took the snapshot — and
 * the elapsed time at that instant is `observedAt - startedAt`, computed
 * entirely from two server timestamps. The browser then adds only how long it
 * has been since the response arrived, which is a *duration* it measures
 * against itself and can therefore get right however wrong its wall clock is.
 *
 * WHY IT TICKS ITSELF
 * -------------------
 * The same reason `LastUpdated` does: elapsed time changes with time, not with
 * input. Without its own ticker the number would sit frozen between polls —
 * fifteen to thirty seconds of a timer that has visibly stopped, which reads as
 * the screen having crashed.
 */

/** A second, because this renders seconds. */
const TICK_MS = 1_000;

@Component({
  selector: 'app-elapsed-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label(); as text) {
      <!--
        A time element with a machine-readable duration, so assistive
        technology gets the exact value and not the abbreviated rendering.
      -->
      <time class="tabular-nums" [attr.datetime]="isoDuration()">{{ text }}</time>
    }
  `,
  host: { class: 'inline-block' },
})
export class ElapsedTime {
  /** When the mechanic clocked on, ISO-8601, as the server reported it. */
  readonly startedAt = input.required<string | undefined>();

  /** The server's clock when the snapshot was taken, ISO-8601. */
  readonly observedAt = input.required<string>();

  /**
   * `Date.now()` when that snapshot reached this browser.
   *
   * The bridge between the two clocks: everything before it is measured on the
   * server, everything after it is measured as a local elapsed duration.
   */
  readonly receivedAt = input.required<number>();

  private readonly destroyRef = inject(DestroyRef);

  /** Re-read every second so the count advances without an input change. */
  private readonly now = signal(Date.now());

  constructor() {
    interval(TICK_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  /** Seconds on the job, or `null` when the mechanic has not clocked on. */
  protected readonly seconds = computed<number | null>(() =>
    elapsedSeconds(this.startedAt(), this.observedAt(), this.receivedAt(), this.now()),
  );

  protected readonly label = computed<string | null>(() => {
    const total = this.seconds();

    return total === null ? null : formatElapsed(total);
  });

  /** The `datetime` attribute's value, e.g. `PT2H5M30S`. */
  protected readonly isoDuration = computed(() => {
    const total = this.seconds();

    if (total === null) {
      return null;
    }

    return `PT${Math.floor(total / 3600)}H${Math.floor((total % 3600) / 60)}M${total % 60}S`;
  });
}
