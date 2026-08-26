import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { Feature } from '../../../core/models';
import { Icon } from '../icon/icon';

export type FeatureCardTone = 'light' | 'dark';

/**
 * Icon + title + description tile. Drives the value propositions, the customer
 * amenities and the "sobre nós" story — three lists that used to be three
 * separate blocks of markup.
 */
@Component({
  selector: 'app-feature-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './feature-card.html',
  host: { class: 'block h-full' },
})
export class FeatureCard {
  readonly feature = input.required<Feature>();
  readonly tone = input<FeatureCardTone>('light');
  /** Shows a large muted index (01, 02, …) in the corner. */
  readonly index = input<number | null>(null);

  protected readonly formattedIndex = computed(() => {
    const value = this.index();
    return value === null ? null : String(value).padStart(2, '0');
  });

  protected readonly cardClasses = computed(() =>
    [
      'group relative flex h-full flex-col overflow-hidden rounded-2xl p-7 transition-all duration-300 ease-out',
      this.tone() === 'dark'
        ? 'bg-ink-900 ring-1 ring-white/10 ring-inset hover:ring-brand-500/50'
        : 'bg-white shadow-card hover:-translate-y-1 hover:shadow-card-hover',
    ].join(' '),
  );

  protected readonly iconWrapClasses = computed(() =>
    [
      'inline-flex size-13 items-center justify-center rounded-xl transition-colors duration-300',
      this.tone() === 'dark'
        ? 'bg-brand-600/15 text-brand-400 group-hover:bg-brand-600 group-hover:text-white'
        : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white',
    ].join(' '),
  );

  protected readonly titleClasses = computed(() =>
    [
      'mt-6 text-lg font-bold tracking-tight',
      this.tone() === 'dark' ? 'text-white' : 'text-ink-950',
    ].join(' '),
  );

  protected readonly indexClasses = computed(() =>
    [
      'pointer-events-none absolute -top-2 right-4 text-6xl font-black tabular-nums',
      this.tone() === 'dark' ? 'text-white/8' : 'text-ink-950/5',
    ].join(' '),
  );

  protected readonly bodyClasses = computed(() =>
    [
      'mt-2.5 text-sm leading-relaxed',
      this.tone() === 'dark' ? 'text-bone-300' : 'text-ink-600',
    ].join(' '),
  );
}
