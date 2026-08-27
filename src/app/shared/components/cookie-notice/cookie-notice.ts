import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConsentService } from '../../../core/services/consent.service';
import { UiButton } from '../ui-button/ui-button';

/**
 * Privacy notice, mounted once by the app shell.
 *
 * Named for what visitors and clients call it — the cookie banner — although
 * the honest version of that sentence is that this site sets **no cookies**.
 * GA4 runs with every Consent Mode storage category denied, so the notice
 * informs rather than asks permission, and "Recusar" is a real opt-out from
 * measurement rather than the cookie toggle it would be on most sites.
 *
 * It is deliberately **not** a modal: nothing is stored until the visitor acts,
 * so there is nothing to gate the page on. Trapping focus and dimming the site
 * to announce "we are not tracking you" would cost every visitor more than the
 * message is worth. It is a `region` that can be ignored, and the page stays
 * fully usable behind it.
 */
@Component({
  selector: 'app-cookie-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton],
  templateUrl: './cookie-notice.html',
})
export class CookieNotice {
  protected readonly consent = inject(ConsentService);
}
