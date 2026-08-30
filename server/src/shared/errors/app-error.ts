/**
 * The error type the HTTP layer understands.
 *
 * WHY A CLASS AND NOT `throw new Error('not found')`
 * --------------------------------------------------
 * A service should be able to say "this customer does not exist" without
 * importing Express or knowing that the answer is 404. `AppError` carries the
 * status, the stable code and a message that is safe to show a caller, so the
 * error middleware can translate any throw into a response without a chain of
 * `instanceof` checks or string matching. Anything that is *not* an `AppError`
 * reaching the middleware is by definition unexpected, and is reported as a
 * generic 500 with the details kept server-side.
 */
import { ERROR_CODES, type ErrorCode } from './error-codes.js';

export interface AppErrorOptions {
  /** Safe to return to the caller — field-level validation issues, for example. */
  readonly details?: unknown;
  /** Kept for the log only; never serialised into a response. */
  readonly cause?: unknown;
  /** Seconds to wait, surfaced as the `Retry-After` header when present. */
  readonly retryAfterSeconds?: number;
}

export class AppError extends Error {
  override readonly name: string = 'AppError';
  readonly httpStatus: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly retryAfterSeconds?: number;
  /**
   * `true` when the message describes a condition the caller can act on.
   * Unexpected failures are not, and are replaced by a generic message in
   * production so internals never leak.
   */
  readonly isOperational = true;

  constructor(httpStatus: number, code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = options.details;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export class BadRequestError extends AppError {
  override readonly name = 'BadRequestError';

  constructor(message: string, options?: AppErrorOptions) {
    super(400, ERROR_CODES.BAD_REQUEST, message, options);
  }
}

export class ValidationError extends AppError {
  override readonly name = 'ValidationError';

  constructor(message: string, details: unknown) {
    super(422, ERROR_CODES.VALIDATION_ERROR, message, { details });
  }
}

export class UnauthorizedError extends AppError {
  override readonly name = 'UnauthorizedError';

  constructor(message = 'Authentication is required.') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  override readonly name = 'ForbiddenError';

  constructor(message = 'You do not have access to this resource.') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  override readonly name = 'NotFoundError';

  constructor(message = 'Resource not found.') {
    super(404, ERROR_CODES.NOT_FOUND, message);
  }
}

export class RateLimitedError extends AppError {
  override readonly name = 'RateLimitedError';

  constructor(message: string, retryAfterSeconds: number) {
    super(429, ERROR_CODES.RATE_LIMITED, message, { retryAfterSeconds });
  }
}
