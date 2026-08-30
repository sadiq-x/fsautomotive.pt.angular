import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConsentService } from '../../../core/services/consent.service';
import { UiButton } from '../ui-button/ui-button';

/**
 * Privacy notice, mounted once by the app shell.
 *
 * Three outcomes, all of them real:
 *
 *  - **Ignored** — measurement runs cookieless, which needs no prior consent.
 *  - **"Aceitar"** — grants `analytics_storage`, so GA4 may set its cookie and
 *    the visit is actually reported. See `AnalyticsService` for why a visit
 *    measured without it appears in no report at all.
 *  - **"Recusar"** — measurement stops entirely, for this visit and later ones.
 *
 * Because accepting now grants storage, this is a genuine consent banner and
 * not merely the informational notice it once was. What has not changed is that
 * nothing is written, and no cookie set, until the visitor actually chooses.
 *
 * It is deliberately **not** a modal: nothing is stored until the visitor acts,
 * so there is nothing to gate the page on. Trapping focus and dimming the site
 * would cost every visitor more than the message is worth. It is a `region`
 * that can be ignored, and the page stays fully usable behind it.
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
