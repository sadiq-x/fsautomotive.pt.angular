import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { StatusBadge } from '../status-badge/status-badge';

/** One labelled field on a detail page. */
export interface DetailField {
  readonly label: string;
  /** `null` renders as a dash, so a missing value still occupies its row. */
  readonly value: string | null;
  readonly badge?: boolean;
  /** Renders as a `tel:`/`mailto:` link when set. */
  readonly href?: string;
  /** Gives the field the full width of the grid, for long free text. */
  readonly wide?: boolean;
}

/**
 * The definition list every detail page is built from.
 *
 * A `<dl>` rather than a grid of `<div>`s: the label/value relationship is what
 * a screen reader needs to read "Matrícula: AA-00-BB" instead of two unrelated
 * strings, and it is free if the right element is used.
 */
@Component({
  selector: 'app-detail-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadge],
  templateUrl: './detail-list.html',
  host: { class: 'block' },
})
export class DetailList {
  readonly fields = input.required<readonly DetailField[]>();
}
