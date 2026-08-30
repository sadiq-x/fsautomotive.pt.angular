/**
 * What every use case needs besides its own arguments.
 *
 * Passing it explicitly — rather than reaching for a global logger or an
 * ambient request — is what keeps a service callable from anywhere: a
 * controller, a scheduled job, a test. It also carries cancellation, so work
 * stops when the caller that wanted it goes away.
 */
import type { Logger } from './logger.js';

export interface UseCaseContext {
  /** Scoped to the originating request, so upstream calls stay traceable. */
  readonly logger: Logger;
  /** Aborted when the caller disconnects. */
  readonly signal?: AbortSignal;
}
