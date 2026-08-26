import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CALL_ACTION, NAV_LINKS } from '../../core/data';
import { Icon, PageSection, UiButton } from '../../shared';

/** 404 page — offers the way back rather than a dead end. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, PageSection, UiButton],
  templateUrl: './not-found.html',
})
export class NotFound {
  protected readonly callAction = CALL_ACTION;
  protected readonly links = NAV_LINKS.filter((link) => !link.exact);
}
