import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';

import { AccordionState } from './accordion-state';

/**
 * Groups `app-accordion-item` children and owns their open/closed state.
 *
 * @example
 * <app-accordion>
 *   <app-accordion-item itemId="pneus" title="Pneus">…</app-accordion-item>
 * </app-accordion>
 */
@Component({
  selector: 'app-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AccordionState],
  template: `<ng-content />`,
  host: { class: 'block divide-y divide-ink-200/70' },
})
export class Accordion {
  /** Allow several panels to stay open at the same time. */
  readonly multiple = input(false);

  private readonly state = inject(AccordionState);

  constructor() {
    effect(() => this.state.multiple.set(this.multiple()));
  }
}
