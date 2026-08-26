import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SITE } from '../../../core/data';
import { Icon } from '../icon/icon';

export type SocialTone = 'light' | 'dark';

/** The Facebook / Instagram / e-mail row, shared by the footer and contacts. */
@Component({
  selector: 'app-social-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './social-links.html',
  host: { class: 'block' },
})
export class SocialLinks {
  readonly tone = input<SocialTone>('dark');
  readonly size = input(20);

  protected readonly socials = SITE.socials;

  protected readonly linkClasses = computed(() =>
    [
      'grid size-11 place-items-center rounded-full transition-all duration-200 hover:-translate-y-0.5',
      this.tone() === 'dark'
        ? 'bg-white/8 text-bone-200 ring-1 ring-white/12 ring-inset hover:bg-brand-600 hover:text-white hover:ring-brand-600'
        : 'bg-bone-200 text-ink-700 hover:bg-brand-600 hover:text-white',
    ].join(' '),
  );
}
