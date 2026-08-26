import type { IconName } from './icon.model';

/** A primary navigation destination, rendered by both the header and the tab bar. */
export interface NavLink {
  /** Full label used on desktop (`Sobre Nós`). */
  readonly label: string;
  /** Compact label used by the mobile tab bar (`Sobre`). */
  readonly shortLabel: string;
  /** Router path, always absolute. */
  readonly path: string;
  readonly icon: IconName;
  /** Only the home route should match exactly when highlighting the active link. */
  readonly exact?: boolean;
}
