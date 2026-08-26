import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { OPENING_HOURS } from '../../../core/data';

export type OpeningHoursTone = 'light' | 'dark';

/** The opening-hours table, rendered from the same data that feeds schema.org. */
@Component({
  selector: 'app-opening-hours',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './opening-hours.html',
  host: { class: 'block' },
})
export class OpeningHours {
  readonly tone = input<OpeningHoursTone>('light');

  protected readonly entries = OPENING_HOURS;

  protected readonly rowClasses = computed(() =>
    this.tone() === 'dark' ? 'border-white/10' : 'border-ink-200/70',
  );
  protected readonly dayClasses = computed(() =>
    this.tone() === 'dark' ? 'text-white' : 'text-ink-950',
  );
  protected readonly periodClasses = computed(() =>
    this.tone() === 'dark' ? 'text-bone-300' : 'text-ink-600',
  );
  protected readonly closedBadgeClasses = computed(() =>
    [
      'rounded-full px-3 py-1 text-meta font-bold tracking-wide uppercase',
      this.tone() === 'dark' ? 'bg-white/10 text-bone-400' : 'bg-ink-950/5 text-ink-500',
    ].join(' '),
  );
}
