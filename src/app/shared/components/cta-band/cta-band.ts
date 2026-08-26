import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CALL_ACTION, DIRECTIONS_ACTION, SITE } from '../../../core/data';
import type { ActionLink } from '../../../core/models';
import { Icon } from '../icon/icon';
import { UiButton } from '../ui-button/ui-button';

/**
 * The closing "fale connosco" band. Appears at the bottom of every page with
 * the same styling and the same two primary actions.
 */
@Component({
  selector: 'app-cta-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, UiButton],
  templateUrl: './cta-band.html',
  host: { class: 'block' },
})
export class CtaBand {
  readonly eyebrow = input('Fale connosco');
  readonly title = input('Precisa de marcar uma intervenção?');
  readonly lead = input(
    'Diga-nos o que se passa com a sua viatura. Damos-lhe um diagnóstico honesto e um orçamento sem compromisso.',
  );

  protected readonly site = SITE;
  protected readonly primary: ActionLink = CALL_ACTION;
  protected readonly secondary: ActionLink = DIRECTIONS_ACTION;
}
