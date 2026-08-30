/**
 * One queue of transient messages for the whole private area.
 *
 * WHY CENTRAL
 * -----------
 * Feedback that each component invents for itself drifts: three shapes of
 * error banner, two of which are missed by screen readers and one of which
 * never disappears. A single queue means the interceptor, a guard and a form
 * all report through the same component, with the same timing and the same
 * accessible announcement.
 *
 * Errors do not auto-dismiss. A success message that vanishes is fine — the
 * user saw the thing succeed — but an error the user missed is an error they
 * will hit again.
 */
import { Injectable, signal } from '@angular/core';

import type { AppNotification, NotificationTone } from '../models/notification.model';

/** How long a non-error message stays on screen. */
const AUTO_DISMISS_MS = 5_000;

/** Beyond this the stack covers the page it is describing. */
const MAX_VISIBLE = 4;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<readonly AppNotification[]>([]);
  private nextId = 1;

  readonly notifications = this.items.asReadonly();

  success(message: string, detail?: string): void {
    this.push('success', message, detail);
  }

  error(message: string, detail?: string): void {
    this.push('error', message, detail);
  }

  warning(message: string, detail?: string): void {
    this.push('warning', message, detail);
  }

  info(message: string, detail?: string): void {
    this.push('info', message, detail);
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  clear(): void {
    this.items.set([]);
  }

  private push(tone: NotificationTone, message: string, detail?: string): void {
    const id = this.nextId++;
    const notification: AppNotification = detail
      ? { id, tone, message, detail }
      : { id, tone, message };

    this.items.update((current) => [...current, notification].slice(-MAX_VISIBLE));

    if (tone !== 'error') {
      const timer = setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
      // Node's timer type in tests exposes `unref`; the browser's does not.
      (timer as unknown as { unref?: () => void }).unref?.();
    }
  }
}
