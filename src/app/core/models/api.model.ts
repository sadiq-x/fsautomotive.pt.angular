/**
 * The backend's response envelope, mirrored exactly.
 *
 * These types are a *contract*, not a convenience: they are the shape
 * `server/src/shared/http/api-response.ts` produces. When the backend changes,
 * this file changes with it — and because everything flows through
 * `ApiClient`, the compiler then points at every affected caller.
 *
 * Discriminating on `success` is what lets a caller tell the two apart without
 * knowing which endpoint it called.
 */

/** Pagination as the backend reports it. `total` is absent when OfficeGest omits it. */
export interface ApiPagination {
  readonly page: number;
  readonly perPage: number;
  readonly total?: number;
  readonly totalPages?: number;
}

export interface ApiSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: ApiPagination;
}

export interface ApiFailure {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly requestId: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** A list plus the pagination that produced it — what every list page renders. */
export interface Paged<T> {
  readonly items: readonly T[];
  readonly pagination: ApiPagination;
}

/**
 * A backend failure, normalised for the UI.
 *
 * Built once by the error interceptor so no component has to inspect an
 * `HttpErrorResponse`, guess whether a body arrived, or decide what a 502
 * should say. `message` is always safe to render.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    /** HTTP status, or `0` when the request never reached the server. */
    readonly status: number,
    /** The backend's stable `error.code`, or a local code for transport faults. */
    readonly code: string,
    /** Written to be shown to a user. */
    override readonly message: string,
    /** Field-level problems from a 422, when the backend sent them. */
    readonly details?: unknown,
    /** The backend's `requestId`, worth quoting in a bug report. */
    readonly requestId?: string,
  ) {
    super(message);
  }

  /** `true` when re-issuing the same request could plausibly succeed. */
  get retryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

/** Field-level validation problems, as the backend's 422 reports them. */
export interface ApiValidationIssue {
  readonly source: 'params' | 'query' | 'body';
  readonly field: string;
  readonly message: string;
}

/** Narrows the opaque `details` of a validation failure. */
export function toValidationIssues(details: unknown): readonly ApiValidationIssue[] {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.filter(
    (issue): issue is ApiValidationIssue =>
      typeof issue === 'object' &&
      issue !== null &&
      typeof (issue as ApiValidationIssue).field === 'string' &&
      typeof (issue as ApiValidationIssue).message === 'string',
  );
}
