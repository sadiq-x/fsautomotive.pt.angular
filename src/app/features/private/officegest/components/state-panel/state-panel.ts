import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { IconName } from '../../../../../core/models';
import { Icon } from '../../../../../shared/components/icon/icon';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';

/**
 * The three states a data-driven page is in when it has nothing to show.
 *
 * WHY ONE COMPONENT FOR ALL THREE
 * -------------------------------
 * They occupy the same place, at the same size, and differ only in wording and
 * whether there is an action. Three components would drift in height and cause
 * the page to jump as one replaced another; one keeps the layout still.
 *
 * The loading state is a skeleton rather than a spinner: it holds the space the
 * rows will occupy, so arriving data does not shift the page — and it tells the
 * user roughly what is coming.
 *
 * `role="status"` announces the change to a screen reader without stealing
 * focus, which `role="alert"` would.
 */
export type PanelState = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-state-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, UiButton],
  templateUrl: './state-panel.html',
  host: { class: 'block' },
})
export class StatePanel {
  readonly state = input.required<PanelState>();
  readonly title = input<string | null>(null);
  readonly message = input<string | null>(null);
  /** Label for the recovery action. Omit to render no button. */
  readonly actionLabel = input<string | null>(null);
  /** How many skeleton rows to draw; match the page size where it is known. */
  readonly skeletonRows = input(6);

  readonly action = output<void>();

  protected readonly icon = computed<IconName>(() =>
    this.state() === 'error' ? 'alert-triangle' : 'inbox',
  );

  protected readonly skeletons = computed(() =>
    Array.from({ length: this.skeletonRows() }, (_, index) => index),
  );
}
