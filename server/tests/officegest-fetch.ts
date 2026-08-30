/**
 * A scriptable stand-in for `fetch`.
 *
 * Every client test needs the same two things: canned responses in a given
 * order, and a record of what was actually sent. Building that once keeps the
 * tests about behaviour rather than about plumbing.
 */
import { vi } from 'vitest';

export interface RecordedCall {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export interface CannedResponse {
  readonly status?: number;
  readonly body?: unknown;
  /** Raw body, for testing responses that are not JSON at all. */
  readonly text?: string;
  readonly contentType?: string | null;
  readonly headers?: Record<string, string>;
  /** Rejects instead of responding — a connection failure. */
  readonly networkError?: Error;
  /** Never settles until the request is aborted — a hung upstream. */
  readonly hang?: boolean;
}

export interface FakeFetch {
  readonly fetch: typeof globalThis.fetch;
  readonly calls: RecordedCall[];
  /** Calls to `POST /auth/login`. */
  loginCalls(): RecordedCall[];
  /** Calls that are not the login handshake. */
  apiCalls(): RecordedCall[];
}

function toResponse(canned: CannedResponse): Response {
  const contentType =
    canned.contentType === undefined ? 'application/json' : (canned.contentType ?? undefined);
  const headers = new Headers(canned.headers);

  if (contentType) {
    headers.set('content-type', contentType);
  }

  const body =
    canned.text !== undefined
      ? canned.text
      : canned.body === undefined
        ? null
        : JSON.stringify(canned.body);

  return new Response(body, { status: canned.status ?? 200, headers });
}

/**
 * @param script Responses in the order the client will consume them. The last
 * entry repeats, so a test that only cares about the first call does not have
 * to enumerate the retries.
 */
export function fakeFetch(script: readonly CannedResponse[]): FakeFetch {
  const calls: RecordedCall[] = [];
  let index = 0;

  // Derived from `fetch` itself rather than named: the DOM lib is not loaded,
  // so `RequestInfo` does not exist here.
  type FetchInput = Parameters<typeof globalThis.fetch>[0];

  const fetchImpl = vi.fn(async (input: FetchInput, init?: RequestInit) => {
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
      headers[key.toLowerCase()] = value;
    }

    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });

    const canned = script[Math.min(index, script.length - 1)] ?? {};
    index += 1;

    if (canned.hang) {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;

        // A signal that is already aborted fires no event, and real `fetch`
        // rejects straight away — so must this.
        if (signal?.aborted) {
          reject(signal.reason ?? new Error('aborted'));
          return;
        }

        signal?.addEventListener('abort', () => {
          reject(signal.reason ?? new Error('aborted'));
        });
      });
    }

    if (canned.networkError) {
      throw canned.networkError;
    }

    return toResponse(canned);
  });

  return {
    fetch: fetchImpl as unknown as typeof globalThis.fetch,
    calls,
    loginCalls: () => calls.filter((call) => call.url.endsWith('/auth/login')),
    apiCalls: () => calls.filter((call) => !call.url.endsWith('/auth/login')),
  };
}

/** A successful login, for scripts that start with the handshake. */
export const LOGIN_OK: CannedResponse = {
  status: 200,
  body: { data: { access_token: 'test-token' } },
};
