import type { IconName } from './icon.model';

/**
 * A call to action. Exactly one of `routerLink` / `href` is expected —
 * `href` is used for external protocols (`tel:`, `mailto:`, `https:`).
 */
export interface ActionLink {
  readonly label: string;
  readonly icon?: IconName;
  readonly routerLink?: string;
  readonly href?: string;
  /** `true` opens the link in a new tab with safe `rel` attributes. */
  readonly external?: boolean;
  /** Accessible name when the visible label is not descriptive enough. */
  readonly ariaLabel?: string;
}
