import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../../../shared/components/icon/icon';
import { StatePanel } from '../state-panel/state-panel';
import type { DetailStatus } from '../../services/resource-detail.store';

/**
 * The frame every detail page renders inside: back link, title, states.
 *
 * Same reasoning as `ResourcePage` — the four states (loading, missing, error,
 * ready) and the way back are identical everywhere, and only the content
 * differs. Projecting the body keeps each page to its fields.
 */
@Component({
  selector: 'app-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, StatePanel],
  templateUrl: './detail-page.html',
  host: { class: 'block' },
})
export class DetailPage {
  readonly status = input.required<DetailStatus>();
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly backLink = input.required<string>();
  readonly backLabel = input.required<string>();
  readonly errorMessage = input<string | null>(null);
  /** Shown in the `missing` state, e.g. "Este cliente não existe no OfficeGest." */
  readonly missingMessage = input('O registo não existe ou foi removido.');
}
