import type { IconName } from './icon.model';

/** One entry of the workshop's service catalogue. */
export interface WorkshopService {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  /** Concrete jobs included, shown as a checklist when the entry is expanded. */
  readonly highlights: readonly string[];
}
