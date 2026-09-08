import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { formatDateTime } from '../../utils/format';

/**
 * How stale the data on screen is, as a coloured dot and a timestamp.
 *
 * WHY THIS IS ITS OWN COMPONENT
 * -----------------------------
 * The OfficeGest data behind these screens is a snapshot: it was true when it
 * was fetched, and the workshop changes it in the ERP all day. A table with no
 * indication of its own age invites the reader to treat it as live — which is
 * how someone quotes a customer from a booking that was cancelled an hour ago.
 * Saying *when* costs one line and removes the ambiguity entirely.
 *
 * It is deliberately presentational: it takes an instant and renders it. No
 * HTTP, no store, no knowledge of what produced the data — which is what lets
 * the same component sit on any screen that fetches anything.
 *
 * WHY IT KEEPS ITS OWN CLOCK
 * --------------------------
 * Freshness changes with time, not with input. Left to Angular's change
 * detection, a page opened at 10:00 and left alone would still claim to be
 * green at 15:00, because nothing about the component's inputs changed. The
 * ticker exists so the dot goes amber and then red on its own — which is
 * exactly when the reader needs to be told.
 */

/** Thresholds, in milliseconds. Green below the first, amber below the second. */
const FRESH_MS = 60 * 60 * 1000;
const STALE_MS = 4 * 60 * 60 * 1000;

/**
 * How often the age is re-evaluated.
 *
 * A minute, because the thresholds are an hour apart: checking more often
 * cannot change the answer any sooner than a minute's precision, and checking
 * less often would let the dot lie for a noticeable stretch.
 */
const TICK_MS = 60 * 1000;

export type Freshness = 'fresh' | 'ageing' | 'stale';

@Component({
  selector: 'app-last-updated',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label(); as text) {
      <!--
        One element, not two: a screen reader should hear "Atualizado há 5
        minutos", not a stray bullet character first. The dot is decorative and
        the wording carries the same meaning the colour does — colour alone is
        never the only signal.
      -->
      <p class="flex items-center gap-2 text-meta text-ink-400" [title]="exact()">
        <span class="size-2 shrink-0 rounded-full" [class]="dotClass()" aria-hidden="true"></span>
        <span>{{ text }}</span>
      </p>
    }
  `,
  host: { class: 'block' },
})
export class LastUpdated {
  /** When the data on screen was fetched. `null` before the first response. */
  readonly since = input<Date | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  /** Re-read on every tick so the age recomputes without an input change. */
  private readonly now = signal(Date.now());

  constructor() {
    interval(TICK_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  /** Milliseconds since the fetch, or `null` when nothing has arrived yet. */
  private readonly age = computed(() => {
    const since = this.since();

    if (!since) {
      return null;
    }

    const elapsed = this.now() - since.getTime();

    // A clock adjustment can put the fetch marginally in the future. Treating
    // that as "just now" is honest; a negative age would render as nonsense.
    return Math.max(0, elapsed);
  });

  protected readonly freshness = computed<Freshness | null>(() => {
    const age = this.age();

    if (age === null) {
      return null;
    }

    if (age < FRESH_MS) {
      return 'fresh';
    }

    return age < STALE_MS ? 'ageing' : 'stale';
  });

  protected readonly dotClass = computed(() => {
    switch (this.freshness()) {
      case 'fresh':
        return 'bg-emerald-500';
      case 'ageing':
        return 'bg-amber-500';
      case 'stale':
        return 'bg-red-500';
      default:
        return 'bg-ink-300';
    }
  });

  /**
   * Relative for the first hour, absolute afterwards.
   *
   * "Há 3 minutos" is what someone wants while they are working; by the time it
   * is hours old, the clock time is more useful than an ever-growing count —
   * and it is the form that survives being read after lunch.
   */
  protected readonly label = computed(() => {
    const age = this.age();
    const since = this.since();

    if (age === null || !since) {
      return null;
    }

    const minutes = Math.floor(age / 60_000);

    if (minutes < 1) {
      return 'Atualizado agora mesmo';
    }

    if (minutes === 1) {
      return 'Atualizado há 1 minuto';
    }

    if (minutes < 60) {
      return `Atualizado há ${minutes} minutos`;
    }

    return `Atualizado às ${formatDateTime(since.toISOString()) ?? ''}`;
  });

  /** The full timestamp, always available on hover. */
  protected readonly exact = computed(() => {
    const since = this.since();
    return since ? (formatDateTime(since.toISOString()) ?? '') : '';
  });
}
