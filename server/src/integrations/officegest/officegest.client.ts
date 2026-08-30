/**
 * The only code in this service that speaks HTTP to OfficeGest.
 *
 * WHY A CLIENT LAYER AT ALL
 * -------------------------
 * Everything above this file — services, controllers, routes — should be able
 * to ask for "the customer with this id" without knowing the base URL, the
 * header the credential goes in, that a 401 means "log in again", or that a
 * dropped connection is worth one more try. Those concerns are not business
 * logic and they are identical for every endpoint; written once here, they
 * cannot drift between resources or be forgotten on the endpoint added next
 * month. It is also the seam that makes the rest of the application testable:
 * a fake `fetch` is injected here and nothing else has to change.
 *
 * WHAT IT GUARANTEES TO CALLERS
 * -----------------------------
 * - Authentication is applied automatically, and re-applied once if the token
 *   expired mid-flight.
 * - No request can hang: every attempt carries a timeout.
 * - Transient failures are retried; deterministic ones never are.
 * - Every outcome is either a validated, typed value or an `OfficeGestError`.
 *   There is no third case, and no raw `Response` escapes this file.
 * - Nothing sensitive is logged: paths and statuses, never headers or bodies.
 */
import { z } from 'zod';

import type { OfficeGestConfig } from '../../config/index.js';
import { logger as rootLogger, type Logger } from '../../shared/logger.js';
import { createAuthStrategy, type OfficeGestAuthStrategy } from './auth/index.js';
import {
  IDEMPOTENT_METHODS,
  MAX_RETRY_DELAY_MS,
  PAGINATION_PARAMS,
  RETRY_BASE_DELAY_MS,
} from './officegest.constants.js';
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
import {
  officeGestErrorBodySchema,
  officeGestItemEnvelope,
  officeGestListEnvelope,
  type OfficeGestListResult,
} from './officegest.types.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Query values callers may pass. `undefined` and `null` are dropped. */
export type QueryValue = string | number | boolean | undefined | null;

export interface OfficeGestRequestOptions {
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  /** Cancels the request when the originating caller goes away. */
  readonly signal?: AbortSignal;
  /** Request-scoped logger, so upstream calls carry the caller's request id. */
  readonly logger?: Logger;
}

/** Seam for tests: a fake `fetch` and a no-wait `sleep` replace the real ones. */
export interface OfficeGestClientDeps {
  readonly fetch?: typeof globalThis.fetch;
  readonly logger?: Logger;
  readonly sleep?: (ms: number) => Promise<void>;
}

interface AttemptContext {
  readonly method: HttpMethod;
  readonly path: string;
  readonly url: string;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly skipAuth: boolean;
  readonly log: Logger;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms).unref?.();
  });

export class OfficeGestClient {
  private readonly auth: OfficeGestAuthStrategy;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly log: Logger;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly config: OfficeGestConfig,
    deps: OfficeGestClientDeps = {},
  ) {
    this.fetchImpl = deps.fetch ?? globalThis.fetch;
    this.log = (deps.logger ?? rootLogger).child({ component: 'officegest-client' });
    this.sleep = deps.sleep ?? defaultSleep;

    // The strategy needs to call OfficeGest (to log in) but must not go through
    // the authenticated path, which would recurse. It gets a narrow, unauth'd
    // request function instead of the whole client.
    this.auth = createAuthStrategy(config.credentials, ({ path, method, body, signal }) =>
      this.send({
        method,
        path,
        url: this.buildUrl(path),
        body,
        signal,
        skipAuth: true,
        log: this.log,
      }),
    );
  }

  /* ------------------------------------------------------------------ */
  /* Typed verbs — the surface every resource uses                       */
  /* ------------------------------------------------------------------ */

  /** A `{ data: [...], meta }` list, validated item by item. */
  async getList<T>(
    path: string,
    itemSchema: z.ZodType<T>,
    options: OfficeGestRequestOptions = {},
  ): Promise<OfficeGestListResult<T>> {
    const envelope = await this.request(
      'GET',
      path,
      officeGestListEnvelope(itemSchema as z.ZodTypeAny),
      options,
    );

    return { items: envelope.data as T[], meta: envelope.meta };
  }

  /** A `{ data: {...} }` single resource. */
  async getOne<T>(
    path: string,
    itemSchema: z.ZodType<T>,
    options: OfficeGestRequestOptions = {},
  ): Promise<T> {
    const envelope = await this.request(
      'GET',
      path,
      officeGestItemEnvelope(itemSchema as z.ZodTypeAny),
      options,
    );

    return envelope.data as T;
  }

  /** Creates a resource and validates the `{ data }` it returns. */
  async postOne<T>(
    path: string,
    itemSchema: z.ZodType<T>,
    options: OfficeGestRequestOptions = {},
  ): Promise<T> {
    const envelope = await this.request(
      'POST',
      path,
      officeGestItemEnvelope(itemSchema as z.ZodTypeAny),
      options,
    );

    return envelope.data as T;
  }

  /**
   * The escape hatch for a call that does not fit the envelope helpers.
   * Still validated — `schema` is mandatory, so no unchecked `unknown` can
   * reach a service.
   */
  async request<T>(
    method: HttpMethod,
    path: string,
    schema: z.ZodType<T>,
    options: OfficeGestRequestOptions = {},
  ): Promise<T> {
    const log = options.logger ?? this.log;
    const url = this.buildUrl(path, options.query);
    const payload = await this.withRetries({
      method,
      path,
      url,
      body: options.body,
      signal: options.signal,
      skipAuth: false,
      log,
    });

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      // Loud, because it almost always means the upstream contract moved.
      log.error('OfficeGest response did not match the expected schema', {
        path,
        method,
        issues: parsed.error.issues,
      });
      throw new OfficeGestMalformedResponseError({ path, method }, parsed.error.issues);
    }

    return parsed.data;
  }

  /** Builds the `page`/`per_page` pair from this service's pagination model. */
  static paginationQuery(page: number, perPage: number): Record<string, QueryValue> {
    return { [PAGINATION_PARAMS.page]: page, [PAGINATION_PARAMS.perPage]: perPage };
  }

  /** Releases the upstream session, if the strategy holds one. Never throws. */
  async dispose(): Promise<void> {
    await this.auth.dispose();
  }

  /* ------------------------------------------------------------------ */
  /* Retry loop                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Runs one logical request, retrying only what is worth retrying.
   *
   * Two independent allowances, deliberately not shared:
   *
   * - **One authentication refresh.** A 401 is not a transient fault, so it
   *   must not consume a retry: a token that expires on the last attempt would
   *   otherwise surface as an auth error to the caller.
   * - **`maxRetries` transient attempts.** Timeouts, connection failures and
   *   5xx, and only for idempotent methods — replaying a `POST` that may have
   *   been processed is how duplicate appointments get created. A 429 is the
   *   exception: it is a refusal, so nothing was processed and any method is
   *   safe to repeat.
   */
  private async withRetries(context: AttemptContext): Promise<unknown> {
    let authRefreshed = false;
    let attempt = 0;

    for (;;) {
      try {
        return await this.send(context);
      } catch (error) {
        if (!(error instanceof OfficeGestError)) {
          throw error;
        }

        if (error instanceof OfficeGestAuthError && !authRefreshed) {
          authRefreshed = true;

          if (await this.auth.onUnauthorized()) {
            continue;
          }
        }

        const canRetry =
          error.retryable &&
          attempt < this.config.maxRetries &&
          (error instanceof OfficeGestRateLimitError || IDEMPOTENT_METHODS.has(context.method));

        if (!canRetry) {
          throw error;
        }

        attempt += 1;
        const delayMs = this.backoffDelay(attempt, error);

        context.log.warn('Retrying OfficeGest request', {
          path: context.path,
          method: context.method,
          attempt,
          maxRetries: this.config.maxRetries,
          delayMs,
          reason: error.name,
          status: error.status ?? null,
        });

        await this.sleep(delayMs);
      }
    }
  }

  /**
   * Exponential backoff with full jitter, and `Retry-After` when the server
   * stated one. Jitter matters under load: without it, every request that
   * failed together retries together, and the upstream is hit by the same
   * spike it just rejected.
   */
  private backoffDelay(attempt: number, error: OfficeGestError): number {
    if (error instanceof OfficeGestRateLimitError && error.retryAfterSeconds !== undefined) {
      return Math.min(error.retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS);
    }

    const ceiling = Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
    return Math.round(ceiling * (0.5 + Math.random() * 0.5));
  }

  /* ------------------------------------------------------------------ */
  /* One attempt                                                         */
  /* ------------------------------------------------------------------ */

  /** Performs a single HTTP attempt and returns the decoded JSON body. */
  private async send(context: AttemptContext): Promise<unknown> {
    const { method, path, url, body, signal, skipAuth, log } = context;
    const startedAt = Date.now();

    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': this.config.userAgent,
    };

    if (body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    if (!skipAuth) {
      Object.assign(headers, await this.auth.getAuthHeaders(signal));
    }

    // Two reasons a request can stop: our own budget, or the caller hanging up.
    // Combining them keeps a single `signal` on the wire while letting the
    // catch block tell the two apart, which the caller needs — a timeout is a
    // 504, an abandoned request is not an error at all.
    const timeoutSignal = AbortSignal.timeout(this.config.timeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    let response: Response;

    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: combinedSignal,
        redirect: 'follow',
      });
    } catch (error) {
      throw this.classifyTransportError(error, context, timeoutSignal, signal, startedAt);
    }

    const durationMs = Date.now() - startedAt;

    log.info('OfficeGest request completed', {
      method,
      path,
      status: response.status,
      durationMs,
      authMode: skipAuth ? 'none' : this.auth.mode,
    });

    if (!response.ok) {
      throw await this.toHttpError(response, context);
    }

    return this.decodeJson(response, context);
  }

  /** Turns a `fetch` rejection into the right error type. */
  private classifyTransportError(
    error: unknown,
    context: AttemptContext,
    timeoutSignal: AbortSignal,
    callerSignal: AbortSignal | undefined,
    startedAt: number,
  ): OfficeGestError {
    const { method, path, log } = context;
    const durationMs = Date.now() - startedAt;
    const base = { path, method, cause: error };

    if (timeoutSignal.aborted) {
      log.warn('OfficeGest request timed out', {
        method,
        path,
        durationMs,
        timeoutMs: this.config.timeoutMs,
      });
      return new OfficeGestTimeoutError(base, this.config.timeoutMs);
    }

    if (callerSignal?.aborted) {
      log.debug('OfficeGest request cancelled by the caller', { method, path, durationMs });
      return new OfficeGestAbortedError(base);
    }

    log.warn('OfficeGest request failed before a response was received', {
      method,
      path,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
    return new OfficeGestNetworkError(base);
  }

  /**
   * Maps an unsuccessful status onto a typed error.
   *
   * The body is read only to enrich a 422 — those field errors are the one part
   * of an upstream error that helps the caller fix their request. Everything
   * else is described by the status alone, and reading further would risk
   * putting upstream data into our logs.
   */
  private async toHttpError(response: Response, context: AttemptContext): Promise<OfficeGestError> {
    const { method, path } = context;
    const base = { path, method, status: response.status };

    switch (response.status) {
      case 401:
        return new OfficeGestAuthError(base);
      case 403:
        return new OfficeGestForbiddenError(base);
      case 404:
        return new OfficeGestNotFoundError(base);
      case 422: {
        const body = await this.readErrorBody(response);
        return new OfficeGestValidationError(base, body?.['errors'] ?? body?.['message']);
      }
      case 429:
        return new OfficeGestRateLimitError(base, this.readRetryAfter(response));
      default:
        if (response.status >= 500) {
          return new OfficeGestServerError(base);
        }

        // Any other 4xx: not something a retry or a token refresh can fix.
        return new OfficeGestValidationError(base, undefined);
    }
  }

  /** `Retry-After` in seconds, whether sent as a delay or an HTTP date. */
  private readRetryAfter(response: Response): number | undefined {
    const header = response.headers.get('retry-after');

    if (!header) {
      return undefined;
    }

    const seconds = Number(header);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds;
    }

    const date = Date.parse(header);

    return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }

  private async readErrorBody(response: Response): Promise<Record<string, unknown> | undefined> {
    try {
      const parsed = officeGestErrorBodySchema.safeParse(await response.json());
      return parsed.success ? parsed.data : undefined;
    } catch {
      // A malformed error body is not itself an error worth raising.
      return undefined;
    }
  }

  /**
   * Decodes a successful response.
   *
   * A 204 and an empty body are legitimate (a delete), so they decode to
   * `undefined` and let the schema decide whether that is acceptable. Anything
   * else that is not JSON is a contract violation — typically an HTML login or
   * maintenance page, which would otherwise fail much later and much less
   * clearly.
   */
  private async decodeJson(response: Response, context: AttemptContext): Promise<unknown> {
    const { method, path } = context;

    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (text.trim() === '') {
      return undefined;
    }

    if (!contentType.toLowerCase().includes('json')) {
      throw new OfficeGestMalformedResponseError(
        { path, method, status: response.status },
        `expected a JSON content-type, received "${contentType || 'none'}"`,
      );
    }

    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      throw new OfficeGestMalformedResponseError(
        { path, method, status: response.status, cause: error },
        'response body was not valid JSON',
      );
    }
  }

  /** Joins the base URL, the path and the non-empty query parameters. */
  private buildUrl(path: string, query?: Readonly<Record<string, QueryValue>>): string {
    const url = new URL(`${this.config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}
