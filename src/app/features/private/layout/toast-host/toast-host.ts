import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import type { IconName, NotificationTone } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { Icon } from '../../../../shared/components/icon/icon';

/**
 * Renders the shared notification queue.
 *
 * ACCESSIBILITY IS THE POINT OF THIS COMPONENT
 * --------------------------------------------
 * A toast that only appears visually is invisible to a screen reader, and one
 * that steals focus interrupts whatever the user was doing. The live region
 * here resolves both: `role="status"` with `aria-live="polite"` announces the
 * message after the current utterance, and focus never moves. Errors use
 * `assertive`, because "your session ended" cannot wait for the user to finish
 * reading a table.
 *
 * The container is `aria-relevant="additions"` so removing a dismissed toast is
 * not announced as a change.
 */
const TONE_STYLES: Record<NotificationTone, string> = {
  success: 'bg-white ring-emerald-600/20 text-ink-900',
  error: 'bg-white ring-brand-600/25 text-ink-900',
  warning: 'bg-white ring-amber-600/25 text-ink-900',
  info: 'bg-white ring-sky-600/20 text-ink-900',
};

const TONE_ICONS: Record<NotificationTone, IconName> = {
  success: 'check',
  error: 'alert-triangle',
  warning: 'alert-triangle',
  info: 'info',
};

const TONE_ICON_STYLES: Record<NotificationTone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  error: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-sky-50 text-sky-700',
};

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './toast-host.html',
  host: {
    class:
      'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-0 sm:items-end',
  },
})
export class ToastHost {
  private readonly service = inject(NotificationService);

  protected readonly notifications = this.service.notifications;
  protected readonly toneStyles = TONE_STYLES;
  protected readonly toneIcons = TONE_ICONS;
  protected readonly toneIconStyles = TONE_ICON_STYLES;

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
