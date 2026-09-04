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
 *
 * WHY DUPLICATES COLLAPSE
 * -----------------------
 * One cause routinely produces several identical messages. The dashboard issues
 * four requests on load — three metrics and the calendar — so a backend that is
 * down fails all four with the same network error. Stacked, that fills the whole
 * queue with one sentence repeated, and because errors never auto-dismiss it
 * stays that way. Saying it four times does not make it four problems.
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
  /** Pending auto-dismiss timers, so a repeat can restart rather than stack. */
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
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
    this.clearTimer(id);
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  clear(): void {
    for (const id of [...this.timers.keys()]) {
      this.clearTimer(id);
    }

    this.items.set([]);
  }

  private push(tone: NotificationTone, message: string, detail?: string): void {
    const existing = this.items().find(
      (item) => item.tone === tone && item.message === message && item.detail === detail,
    );

    // Already on screen. Keep it where it is — moving it would make the stack
    // jump under the cursor — but give a dismissable one its full time again,
    // so a recurring message does not disappear early because of an older twin.
    if (existing) {
      this.schedule(existing.id, tone);
      return;
    }

    const id = this.nextId++;
    const notification: AppNotification = detail
      ? { id, tone, message, detail }
      : { id, tone, message };

    this.items.update((current) => {
      const next = [...current, notification];
      // Dropping the oldest must also drop its pending timer, or it fires later
      // against an id that is no longer in the queue.
      for (const dropped of next.slice(0, Math.max(0, next.length - MAX_VISIBLE))) {
        this.clearTimer(dropped.id);
      }

      return next.slice(-MAX_VISIBLE);
    });

    this.schedule(id, tone);
  }

  private schedule(id: number, tone: NotificationTone): void {
    if (tone === 'error') {
      return;
    }

    this.clearTimer(id);

    const timer = setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
    // Node's timer type in tests exposes `unref`; the browser's does not.
    (timer as unknown as { unref?: () => void }).unref?.();
    this.timers.set(id, timer);
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);

    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
