/**
 * The response envelope every endpoint of this service returns.
 *
 * WHY AN ENVELOPE
 * ---------------
 * A caller should be able to tell success from failure without a table of which
 * endpoint returns what. One discriminated shape — `success: true` with `data`,
 * or `success: false` with `error` — means the front end writes that check once.
 * It also gives pagination somewhere to live that is not mixed into the payload.
 *
 * The upstream envelope (`{ data, meta }`) is deliberately *not* forwarded
 * as-is: it is OfficeGest's contract, and letting it reach the browser would
 * make every future upstream change a breaking change for this API.
 */
import type { ErrorCode } from '../errors/error-codes.js';

export interface PaginationMeta {
  readonly page: number;
  readonly perPage: number;
  /** Total matching records, when the upstream response reports one. */
  readonly total?: number;
  readonly totalPages?: number;
}

export interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
}

export interface ErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    /** Present only for errors whose details are safe to publish. */
    readonly details?: unknown;
  };
  /** Echoes `x-request-id` so a user can quote it in a bug report. */
  readonly requestId: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function success<T>(data: T, meta?: PaginationMeta): SuccessResponse<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function failure(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: unknown,
): ErrorResponse {
  return {
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
    requestId,
  };
}
