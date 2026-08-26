import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import type { IconName } from '../../../core/models';
import { Icon } from '../icon/icon';
import { AccordionState } from './accordion-state';

/**
 * One disclosure row. The header is a real `<button>` with `aria-expanded` /
 * `aria-controls`, and the panel animates open with a `grid-template-rows`
 * transition so no height has to be measured in JavaScript.
 */
@Component({
  selector: 'app-accordion-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './accordion-item.html',
  host: { class: 'block' },
})
export class AccordionItem {
  readonly itemId = input.required<string>();
  readonly title = input.required<string>();
  readonly summary = input<string | null>(null);
  readonly icon = input<IconName | null>(null);

  private readonly state = inject(AccordionState);

  protected readonly open = computed(() => this.state.isOpen(this.itemId()));
  protected readonly panelId = computed(() => `accordion-panel-${this.itemId()}`);
  protected readonly headerId = computed(() => `accordion-header-${this.itemId()}`);

  protected readonly panelClasses = computed(() =>
    [
      'pb-6 transition-opacity duration-300',
      this.open() ? 'opacity-100' : 'opacity-0',
      this.icon() ? 'pl-1 sm:pl-18' : 'pl-1',
    ].join(' '),
  );

  protected toggle(): void {
    this.state.toggle(this.itemId());
  }
}
