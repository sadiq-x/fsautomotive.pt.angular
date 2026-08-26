import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type HeadingAlign = 'left' | 'center';
export type HeadingTone = 'light' | 'dark';

/**
 * Eyebrow + title + lead paragraph, with the brand's red underline accent.
 * Used at the top of every section so headings never drift in size or weight.
 */
@Component({
  selector: 'app-section-heading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-heading.html',
  host: { '[class]': 'hostClasses()' },
})
export class SectionHeading {
  readonly eyebrow = input<string | null>(null);
  readonly title = input.required<string>();
  readonly lead = input<string | null>(null);
  readonly align = input<HeadingAlign>('center');
  /** `dark` inverts the palette for use on the ink-coloured bands. */
  readonly tone = input<HeadingTone>('light');
  /** Renders the title as `<h1>`; one per page. */
  readonly level = input<1 | 2>(2);

  protected readonly hostClasses = computed(() =>
    ['block', this.align() === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left'].join(' '),
  );

  protected readonly eyebrowClasses = computed(() =>
    [
      'inline-flex items-center gap-2 text-eyebrow uppercase',
      this.tone() === 'dark' ? 'text-brand-400' : 'text-brand-600',
    ].join(' '),
  );

  protected readonly titleClasses = computed(() =>
    [
      'font-extrabold',
      this.level() === 1 ? 'text-h1' : 'text-h2',
      this.tone() === 'dark' ? 'text-white' : 'text-ink-950',
      this.eyebrow() ? 'mt-4' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected readonly leadClasses = computed(() =>
    [
      'mt-5 text-lead',
      this.tone() === 'dark' ? 'text-bone-300' : 'text-ink-600',
      this.align() === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl',
    ].join(' '),
  );

  protected readonly ruleClasses = computed(() =>
    ['mt-5 h-1 w-16 rounded-full bg-brand-600', this.align() === 'center' ? 'mx-auto' : ''].join(
      ' ',
    ),
  );
}
