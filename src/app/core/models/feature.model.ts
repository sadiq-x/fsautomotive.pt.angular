import type { IconName } from './icon.model';

/** A generic icon + title + text block: values, amenities, selling points. */
export interface Feature {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}
