/** A transient message shown in the private area's toast stack. */
export type NotificationTone = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  readonly id: number;
  readonly tone: NotificationTone;
  readonly message: string;
  /** Optional second line, e.g. a request id for a support ticket. */
  readonly detail?: string;
}
