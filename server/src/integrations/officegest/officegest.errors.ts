/**
 * Failure modes of the OfficeGest integration, as types.
 *
 * WHY THESE ARE NOT `AppError`s
 * -----------------------------
 * "OfficeGest rejected our credentials" and "the caller is not authenticated"
 * are both 401s upstream, but they mean opposite things: the first is our
 * misconfiguration and the caller can do nothing about it, the second is the
 * caller's problem. Collapsing them early would make the API lie. The client
 * therefore raises integration-specific errors, and a single mapping table in
 * `officegest.mapper` decides what each one becomes at the edge.
 *
 * The classification also drives retries: only errors marked `retryable` are
 * worth attempting again.
 */

export interface OfficeGestErrorContext {
  /** Path relative to the base URL, e.g. `/entities/customers`. Never the full URL with query. */
  readonly path: string;
  readonly method: string;
  readonly status?: number;
  readonly cause?: unknown;
}

export abstract class OfficeGestError extends Error {
  override readonly name: string = 'OfficeGestError';
  readonly path: string;
  readonly method: string;
  readonly status?: number;
  /** Whether a further attempt could plausibly succeed. */
  abstract readonly retryable: boolean;

  protected constructor(message: string, context: OfficeGestErrorContext) {
    super(message, context.cause === undefined ? undefined : { cause: context.cause });
    this.path = context.path;
    this.method = context.method;
    this.status = context.status;
  }
}

/** 401 — the configured credential was rejected. Retrying with it cannot help. */
export class OfficeGestAuthError extends OfficeGestError {
  override readonly name = 'OfficeGestAuthError';
  override readonly retryable = false;

  constructor(context: OfficeGestErrorContext) {
    super('OfficeGest rejected the configured credentials.', context);
  }
}

/** 403 — authenticated, but this API user lacks the module or permission. */
export class OfficeGestForbiddenError extends OfficeGestError {
  override readonly name = 'OfficeGestForbiddenError';
  override readonly retryable = false;

  constructor(context: OfficeGestErrorContext) {
    super('OfficeGest denied access to this resource for the configured API user.', context);
  }
}

/** 404 — the record does not exist upstream. */
export class OfficeGestNotFoundError extends OfficeGestError {
  override readonly name = 'OfficeGestNotFoundError';
  override readonly retryable = false;

  constructor(context: OfficeGestErrorContext) {
    super('OfficeGest has no record at this path.', context);
  }
}

/** 422 — OfficeGest refused the payload. `details` carries its own field errors. */
export class OfficeGestValidationError extends OfficeGestError {
  override readonly name = 'OfficeGestValidationError';
  override readonly retryable = false;
  readonly details: unknown;

  constructor(context: OfficeGestErrorContext, details: unknown) {
    super('OfficeGest rejected the submitted data.', context);
    this.details = details;
  }
}

/** 429 — quota exhausted. Retryable, but only after the advertised delay. */
export class OfficeGestRateLimitError extends OfficeGestError {
  override readonly name = 'OfficeGestRateLimitError';
  override readonly retryable = true;
  /** From `Retry-After`, when OfficeGest sends it. */
  readonly retryAfterSeconds?: number;

  constructor(context: OfficeGestErrorContext, retryAfterSeconds?: number) {
    super('OfficeGest rate limit reached.', context);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** 5xx — an upstream fault. Usually transient. */
export class OfficeGestServerError extends OfficeGestError {
  override readonly name = 'OfficeGestServerError';
  override readonly retryable = true;

  constructor(context: OfficeGestErrorContext) {
    super('OfficeGest returned a server error.', context);
  }
}

/** The per-attempt budget elapsed before headers arrived. */
export class OfficeGestTimeoutError extends OfficeGestError {
  override readonly name = 'OfficeGestTimeoutError';
  override readonly retryable = true;
  readonly timeoutMs: number;

  constructor(context: OfficeGestErrorContext, timeoutMs: number) {
    super(`OfficeGest did not respond within ${timeoutMs}ms.`, context);
    this.timeoutMs = timeoutMs;
  }
}

/** DNS, TLS or connection failure — the request never reached OfficeGest. */
export class OfficeGestNetworkError extends OfficeGestError {
  override readonly name = 'OfficeGestNetworkError';
  override readonly retryable = true;

  constructor(context: OfficeGestErrorContext) {
    super('OfficeGest could not be reached.', context);
  }
}

/**
 * A 2xx response that is not the JSON we can work with.
 *
 * Not retryable: a deterministic contract mismatch returns the same body every
 * time, and retrying only multiplies the damage. It is logged loudly because it
 * almost always means the upstream contract moved.
 */
export class OfficeGestMalformedResponseError extends OfficeGestError {
  override readonly name = 'OfficeGestMalformedResponseError';
  override readonly retryable = false;
  /** Schema issues, for the log — never for the caller. */
  readonly issues: unknown;

  constructor(context: OfficeGestErrorContext, issues: unknown) {
    super('OfficeGest returned a response in an unexpected format.', context);
    this.issues = issues;
  }
}

/** The request was cancelled by the caller (client disconnected). */
export class OfficeGestAbortedError extends OfficeGestError {
  override readonly name = 'OfficeGestAbortedError';
  override readonly retryable = false;

  constructor(context: OfficeGestErrorContext) {
    super('The OfficeGest request was cancelled.', context);
  }
}
