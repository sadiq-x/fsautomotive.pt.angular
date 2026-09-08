/**
 * Request-scoped values added by `requestContext`.
 *
 * Declared once here so handlers read `req.log` with full typing instead of
 * casting, and so it is obvious that these two properties are always present
 * downstream of that middleware.
 */
import type { SessionUser } from '../modules/auth/auth.model.js';
import type { Logger } from '../shared/logger.js';

/**
 * Who is making the request, as `identify` established it.
 *
 * A discriminated union rather than an optional `user`, because these are four
 * different answers and the guards treat them differently — `undefined` would
 * collapse them into one.
 *
 * `unguarded` is the one that repays reading twice: it means no access control
 * is configured at all, which is a legitimate state for a development checkout
 * and must not be confused with `anonymous`, which means a guard exists and
 * this caller failed it.
 */
type Principal =
  | { readonly kind: 'session'; readonly user: SessionUser }
  | { readonly kind: 'api-key' }
  | { readonly kind: 'unguarded' }
  | { readonly kind: 'anonymous' };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlates every log line and the error response for one request. */
      id: string;
      /** The process logger, pre-stamped with this request's id. */
      log: Logger;
      /**
       * Aborted when the client disconnects before the response is finished.
       * Pass it to every upstream call so the work stops with the caller.
       */
      abortSignal: AbortSignal;
      /**
       * Set by `identify`. Optional in the type because a route mounted
       * before that middleware has no principal — reading it as possibly
       * `undefined` is what makes such a mistake a compile-time question
       * rather than a guard that silently sees `anonymous`.
       */
      principal?: Principal;
      /**
       * Output of `validationFor`. Read it through the validator's `read`
       * function rather than directly — that is what carries the type.
       */
      validated: {
        readonly params: unknown;
        readonly query: unknown;
        readonly body: unknown;
      };
    }
  }
}

export {};
