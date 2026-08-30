/**
 * Client behaviour under every failure mode the network offers.
 *
 * These are the tests that matter most in this codebase: the client is the only
 * component whose correctness depends on things that cannot be reproduced by
 * reading it — a token expiring mid-flight, a 500 on the second of three
 * attempts, an upstream that answers HTML. All of it is driven through an
 * injected `fetch`, so the suite is fast, offline, and uses no real credential.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { OfficeGestConfig } from '../../config/officegest.config.js';
import { fakeFetch, LOGIN_OK } from '../../../tests/officegest-fetch.js';
import { OfficeGestClient } from './officegest.client.js';
import {
  OfficeGestAuthError,
  OfficeGestForbiddenError,
  OfficeGestMalformedResponseError,
  OfficeGestNetworkError,
  OfficeGestNotFoundError,
  OfficeGestRateLimitError,
  OfficeGestServerError,
  OfficeGestTimeoutError,
  OfficeGestValidationError,
} from './officegest.errors.js';
import { officeGestRecordSchema } from './officegest.types.js';

const BASE_URL = 'https://tenant.example.test/api/v2';

function makeConfig(overrides: Partial<OfficeGestConfig> = {}): OfficeGestConfig {
  return {
    baseUrl: BASE_URL,
    credentials: { mode: 'bearer-login', username: 'api-user', password: 'secret' },
    timeoutMs: 1_000,
    maxRetries: 2,
    userAgent: 'test-agent/1.0',
    ...overrides,
  };
}

/** Retries are exercised without actually waiting for the backoff. */
const noWait = async (): Promise<void> => undefined;

describe('OfficeGestClient', () => {
  describe('successful requests', () => {
    it('authenticates, sends the bearer token and returns the validated list', async () => {
      const http = fakeFetch([
        LOGIN_OK,
        { body: { data: [{ id: '1', name: 'Ana' }], meta: { current_page: 1, total: 42 } } },
      ]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      const result = await client.getList('/entities/customers', officeGestRecordSchema, {
        query: { page: 1, per_page: 25 },
      });

      expect(result.items).toEqual([{ id: '1', name: 'Ana' }]);
      expect(result.meta?.['total']).toBe(42);

      const [login] = http.loginCalls();
      expect(login?.method).toBe('POST');
      expect(login?.body).toEqual({ username: 'api-user', password: 'secret' });

      const [request] = http.apiCalls();
      expect(request?.url).toBe(`${BASE_URL}/entities/customers?page=1&per_page=25`);
      expect(request?.headers['authorization']).toBe('Bearer test-token');
      expect(request?.headers['user-agent']).toBe('test-agent/1.0');
    });

    it('logs in once for several requests', async () => {
      const http = fakeFetch([LOGIN_OK, { body: { data: [] } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await client.getList('/entities/customers', officeGestRecordSchema);
      await client.getList('/workshop/vehicles', officeGestRecordSchema);

      expect(http.loginCalls()).toHaveLength(1);
      expect(http.apiCalls()).toHaveLength(2);
    });

    it('collapses concurrent cold starts onto a single login', async () => {
      const http = fakeFetch([LOGIN_OK, { body: { data: [] } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await Promise.all([
        client.getList('/entities/customers', officeGestRecordSchema),
        client.getList('/entities/customers', officeGestRecordSchema),
        client.getList('/entities/customers', officeGestRecordSchema),
      ]);

      expect(http.loginCalls()).toHaveLength(1);
    });

    it('omits empty query parameters instead of sending blanks', async () => {
      const http = fakeFetch([LOGIN_OK, { body: { data: [] } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await client.getList('/entities/customers', officeGestRecordSchema, {
        query: { page: 1, search: undefined, status: '' },
      });

      expect(http.apiCalls()[0]?.url).toBe(`${BASE_URL}/entities/customers?page=1`);
    });

    it('sends HTTP Basic and never logs in when configured for basic auth', async () => {
      const http = fakeFetch([{ body: { data: [] } }]);
      const client = new OfficeGestClient(
        makeConfig({ credentials: { mode: 'basic', username: 'user', password: '123' } }),
        { fetch: http.fetch, sleep: noWait },
      );

      await client.getList('/entities/customers', officeGestRecordSchema);

      expect(http.loginCalls()).toHaveLength(0);
      expect(http.apiCalls()[0]?.headers['authorization']).toBe(
        `Basic ${Buffer.from('user:123').toString('base64')}`,
      );
    });
  });

  describe('authentication failures', () => {
    it('re-authenticates once when the token has expired mid-flight', async () => {
      const http = fakeFetch([
        LOGIN_OK,
        { status: 401 },
        { status: 200, body: { data: { access_token: 'second-token' } } },
        { body: { data: [{ id: '7' }] } },
      ]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      const result = await client.getList('/entities/customers', officeGestRecordSchema);

      expect(result.items).toEqual([{ id: '7' }]);
      expect(http.loginCalls()).toHaveLength(2);
      expect(http.apiCalls().at(-1)?.headers['authorization']).toBe('Bearer second-token');
    });

    it('gives up when a freshly issued token is also rejected', async () => {
      const http = fakeFetch([LOGIN_OK, { status: 401 }, LOGIN_OK, { status: 401 }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestAuthError);

      // Exactly one refresh — not a login loop.
      expect(http.loginCalls()).toHaveLength(2);
    });

    it('does not retry a rejected Basic credential', async () => {
      const http = fakeFetch([{ status: 401 }]);
      const client = new OfficeGestClient(
        makeConfig({ credentials: { mode: 'basic', username: 'user', password: 'wrong' } }),
        { fetch: http.fetch, sleep: noWait },
      );

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestAuthError);
      expect(http.calls).toHaveLength(1);
    });
  });

  describe('HTTP errors', () => {
    it.each([
      [403, OfficeGestForbiddenError],
      [404, OfficeGestNotFoundError],
      [422, OfficeGestValidationError],
    ])('maps %i to the matching error type', async (status, expected) => {
      const http = fakeFetch([LOGIN_OK, { status, body: { message: 'nope' } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getOne('/entities/customers/1', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(expected);
    });

    it('carries the upstream field errors on a 422', async () => {
      const http = fakeFetch([
        LOGIN_OK,
        { status: 422, body: { errors: { start_date: ['is required'] } } },
      ]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.postOne('/crm/appointments', officeGestRecordSchema, { body: {} }),
      ).rejects.toMatchObject({ details: { start_date: ['is required'] } });
    });

    it('reads Retry-After from a 429', async () => {
      const http = fakeFetch([
        LOGIN_OK,
        { status: 429, headers: { 'retry-after': '7' } },
        { status: 429, headers: { 'retry-after': '7' } },
        { status: 429, headers: { 'retry-after': '7' } },
      ]);
      const client = new OfficeGestClient(makeConfig({ maxRetries: 2 }), {
        fetch: http.fetch,
        sleep: noWait,
      });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toMatchObject({ name: 'OfficeGestRateLimitError', retryAfterSeconds: 7 });
    });

    it('surfaces a persistent 500 as a server error after exhausting retries', async () => {
      const http = fakeFetch([LOGIN_OK, { status: 500 }]);
      const client = new OfficeGestClient(makeConfig({ maxRetries: 2 }), {
        fetch: http.fetch,
        sleep: noWait,
      });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestServerError);
      expect(http.apiCalls()).toHaveLength(3);
    });
  });

  describe('retries', () => {
    it('retries a transient 500 and succeeds', async () => {
      const http = fakeFetch([LOGIN_OK, { status: 500 }, { body: { data: [{ id: '1' }] } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      const result = await client.getList('/entities/customers', officeGestRecordSchema);

      expect(result.items).toEqual([{ id: '1' }]);
      expect(http.apiCalls()).toHaveLength(2);
    });

    it('never replays a POST that failed with a server error', async () => {
      const http = fakeFetch([LOGIN_OK, { status: 500 }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.postOne('/crm/appointments', officeGestRecordSchema, { body: { title: 'x' } }),
      ).rejects.toBeInstanceOf(OfficeGestServerError);

      // One attempt only: the booking may already exist upstream.
      expect(http.apiCalls()).toHaveLength(1);
    });

    it('does retry a POST that was rate limited, because nothing was processed', async () => {
      const http = fakeFetch([LOGIN_OK, { status: 429 }, { body: { data: { id: '9' } } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.postOne('/crm/appointments', officeGestRecordSchema, { body: { title: 'x' } }),
      ).resolves.toEqual({ id: '9' });
      expect(http.apiCalls()).toHaveLength(2);
    });

    it('does not retry a 404', async () => {
      const http = fakeFetch([LOGIN_OK, { status: 404 }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getOne('/entities/customers/none', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestNotFoundError);
      expect(http.apiCalls()).toHaveLength(1);
    });
  });

  describe('transport failures', () => {
    it('reports a timeout when the upstream never answers', async () => {
      const http = fakeFetch([LOGIN_OK, { hang: true }]);
      const client = new OfficeGestClient(makeConfig({ timeoutMs: 20, maxRetries: 0 }), {
        fetch: http.fetch,
        sleep: noWait,
      });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestTimeoutError);
    });

    it('retries a timeout for an idempotent request', async () => {
      const http = fakeFetch([LOGIN_OK, { hang: true }, { body: { data: [] } }]);
      const client = new OfficeGestClient(makeConfig({ timeoutMs: 20 }), {
        fetch: http.fetch,
        sleep: noWait,
      });

      await expect(client.getList('/entities/customers', officeGestRecordSchema)).resolves.toEqual({
        items: [],
        meta: undefined,
      });
    });

    it('reports a connection failure as a network error', async () => {
      const http = fakeFetch([LOGIN_OK, { networkError: new TypeError('fetch failed') }]);
      const client = new OfficeGestClient(makeConfig({ maxRetries: 0 }), {
        fetch: http.fetch,
        sleep: noWait,
      });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestNetworkError);
    });

    it('stops when the caller aborts, without consuming a retry', async () => {
      const http = fakeFetch([LOGIN_OK, { hang: true }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });
      const controller = new AbortController();

      const pending = client.getList('/entities/customers', officeGestRecordSchema, {
        signal: controller.signal,
      });

      controller.abort();

      await expect(pending).rejects.toMatchObject({ name: 'OfficeGestAbortedError' });
      expect(http.apiCalls()).toHaveLength(1);
    });
  });

  describe('malformed responses', () => {
    it('rejects a 200 that is not JSON', async () => {
      const http = fakeFetch([
        LOGIN_OK,
        { text: '<html>maintenance</html>', contentType: 'text/html' },
      ]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestMalformedResponseError);
    });

    it('rejects a JSON body that does not match the envelope', async () => {
      const http = fakeFetch([LOGIN_OK, { body: { unexpected: true } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestMalformedResponseError);
    });

    it('rejects a body whose items fail the item schema', async () => {
      const http = fakeFetch([LOGIN_OK, { body: { data: [{ id: 1 }] } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getList('/entities/customers', z.object({ id: z.string() })),
      ).rejects.toBeInstanceOf(OfficeGestMalformedResponseError);
    });

    it('rejects a login response with no recognisable token field', async () => {
      const http = fakeFetch([{ body: { data: { nothing: 'here' } } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await expect(
        client.getList('/entities/customers', officeGestRecordSchema),
      ).rejects.toBeInstanceOf(OfficeGestMalformedResponseError);
    });

    it('accepts the documented `data.token` spelling as well as `access_token`', async () => {
      const http = fakeFetch([{ body: { data: { token: 'documented' } } }, { body: { data: [] } }]);
      const client = new OfficeGestClient(makeConfig(), { fetch: http.fetch, sleep: noWait });

      await client.getList('/entities/customers', officeGestRecordSchema);

      expect(http.apiCalls()[0]?.headers['authorization']).toBe('Bearer documented');
    });
  });
});
