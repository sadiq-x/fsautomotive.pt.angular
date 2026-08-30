/**
 * Request-scoped values added by `requestContext`.
 *
 * Declared once here so handlers read `req.log` with full typing instead of
 * casting, and so it is obvious that these two properties are always present
 * downstream of that middleware.
 */
import type { Logger } from '../shared/logger.js';

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
