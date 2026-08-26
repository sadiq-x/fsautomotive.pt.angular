import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SectionTone = 'bone' | 'white' | 'dark' | 'transparent';
export type SectionSpacing = 'sm' | 'md' | 'lg';

const TONES: Record<SectionTone, string> = {
  bone: 'bg-bone-100 text-ink-900',
  white: 'bg-white text-ink-900',
  dark: 'bg-ink-950 text-bone-100',
  transparent: '',
};

const SPACING: Record<SectionSpacing, string> = {
  sm: 'py-12 sm:py-16',
  md: 'py-16 sm:py-20 lg:py-24',
  lg: 'py-20 sm:py-28 lg:py-32',
};

/**
 * The vertical rhythm primitive: one band of the page with a consistent
 * background, padding and gutter. Every section on the site goes through it,
 * which is what keeps the spacing scale uniform.
 */
@Component({
  selector: 'app-page-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()">
      <ng-content />
    </div>
  `,
  host: {
    '[class]': 'hostClasses()',
    '[attr.id]': 'sectionId()',
  },
})
export class PageSection {
  readonly tone = input<SectionTone>('bone');
  readonly spacing = input<SectionSpacing>('md');
  /** Anchor id, so CTAs can deep-link to a band (`/servicos#veiculos`). */
  readonly sectionId = input<string | null>(null);
  /** Removes the max-width container for full-bleed content. */
  readonly bleed = input(false);

  protected readonly hostClasses = computed(() =>
    ['block', TONES[this.tone()], SPACING[this.spacing()]].filter(Boolean).join(' '),
  );

  protected readonly containerClasses = computed(() => (this.bleed() ? '' : 'container-page'));
}
