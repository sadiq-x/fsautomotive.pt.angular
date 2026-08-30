/**
 * Translates an integration failure into the HTTP answer this API gives.
 *
 * WHY THE MAPPING IS NOT THE IDENTITY
 * -----------------------------------
 * Forwarding OfficeGest's status code would make this API lie about whose fault
 * a failure is. The two that matter most:
 *
 * - **Upstream 401 → 502.** OfficeGest rejecting *our* credential is a
 *   deployment fault. Returning 401 would tell the browser to prompt for
 *   credentials it does not have and cannot fix, and would hide a broken
 *   configuration behind what looks like a routine auth failure.
 * - **Upstream 403 → 502.** Same reasoning: the API user is missing a module or
 *   permission in OfficeGest. The caller is not forbidden — we are.
 *
 * The ones that pass through do so because they genuinely describe the caller's
 * request: a 404 means the record they asked for does not exist, and a 422
 * means the data they submitted was refused.
 *
 * Keeping this table in one function is what stops the distinction from being
 * re-litigated, differently, in each controller.
 */
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import {
  OfficeGestAbortedError,
  OfficeGestAuthError,
  OfficeGestError,
  OfficeGestForbiddenError,
  OfficeGestMalformedResponseError,
  OfficeGestNetworkError,
  OfficeGestNotFoundError,
  OfficeGestRateLimitError,
  OfficeGestServerError,
  OfficeGestTimeoutError,
  OfficeGestValidationError,
} from './officegest.errors.js';

/** `true` when the caller hung up — no response will be written. */
export function isClientDisconnect(error: unknown): error is OfficeGestAbortedError {
  return error instanceof OfficeGestAbortedError;
}

/**
 * Maps any OfficeGest failure to an `AppError`. Non-integration errors are
 * returned untouched so genuine bugs keep their identity and reach the error
 * middleware as unexpected 500s rather than being disguised as upstream faults.
 */
export function toAppError(error: unknown): unknown {
  if (!(error instanceof OfficeGestError)) {
    return error;
  }

  if (error instanceof OfficeGestNotFoundError) {
    return new AppError(
      404,
      ERROR_CODES.OFFICEGEST_NOT_FOUND,
      'Resource not found in OfficeGest.',
      {
        cause: error,
      },
    );
  }

  if (error instanceof OfficeGestValidationError) {
    return new AppError(
      422,
      ERROR_CODES.OFFICEGEST_VALIDATION_ERROR,
      'OfficeGest rejected the submitted data.',
      // Upstream field errors are the one detail worth forwarding: they tell
      // the caller which field to fix.
      { details: error.details, cause: error },
    );
  }

  if (error instanceof OfficeGestRateLimitError) {
    return new AppError(
      429,
      ERROR_CODES.OFFICEGEST_RATE_LIMITED,
      'OfficeGest is rate limiting this integration. Please retry shortly.',
      { retryAfterSeconds: error.retryAfterSeconds ?? 30, cause: error },
    );
  }

  if (error instanceof OfficeGestTimeoutError) {
    return new AppError(
      504,
      ERROR_CODES.OFFICEGEST_TIMEOUT,
      'OfficeGest did not respond in time.',
      {
        cause: error,
      },
    );
  }

  if (error instanceof OfficeGestAuthError) {
    return new AppError(
      502,
      ERROR_CODES.OFFICEGEST_AUTH_ERROR,
      'Unable to authenticate with OfficeGest.',
      { cause: error },
    );
  }

  if (error instanceof OfficeGestForbiddenError) {
    return new AppError(
      502,
      ERROR_CODES.OFFICEGEST_FORBIDDEN,
      'This integration is not permitted to read that OfficeGest resource.',
      { cause: error },
    );
  }

  if (error instanceof OfficeGestNetworkError || error instanceof OfficeGestServerError) {
    return new AppError(
      502,
      ERROR_CODES.OFFICEGEST_UNAVAILABLE,
      'Unable to retrieve data from OfficeGest.',
      { cause: error },
    );
  }

  if (error instanceof OfficeGestMalformedResponseError) {
    return new AppError(
      502,
      ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
      'OfficeGest returned an unexpected response.',
      { cause: error },
    );
  }

  return new AppError(
    502,
    ERROR_CODES.OFFICEGEST_API_ERROR,
    'Unable to retrieve data from OfficeGest.',
    { cause: error },
  );
}
