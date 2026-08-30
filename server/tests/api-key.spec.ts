/**
 * The guard on this service's own endpoints.
 *
 * In its own file because the guard is built from configuration when the app is
 * assembled, so exercising it means re-importing the module graph with a
 * different environment — which must not leak into the other suites.
 */
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeFetch, LOGIN_OK } from './officegest-fetch.js';

const ORIGINAL_KEYS = process.env['BACKEND_API_KEYS'];

/** Rebuilds the application with the API-key guard configured. */
async function appWithKeys(keys: string) {
  process.env['BACKEND_API_KEYS'] = keys;
  vi.resetModules();

  const { createApp } = await import('../src/app.js');
  const { createContainer } = await import('../src/container.js');
  const http = fakeFetch([LOGIN_OK, { body: { data: [], meta: undefined } }]);

  return createApp(createContainer({ fetch: http.fetch, sleep: async () => undefined }));
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env['BACKEND_API_KEYS'] = ORIGINAL_KEYS;
  vi.resetModules();
});

describe('x-api-key guard', () => {
  it('rejects a request with no key', async () => {
    const app = await appWithKeys('front-end-key');

    const response = await request(app).get('/api/officegest/customers').expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a wrong key', async () => {
    const app = await appWithKeys('front-end-key');

    await request(app).get('/api/officegest/customers').set('x-api-key', 'not-the-key').expect(401);
  });

  it('accepts a configured key', async () => {
    const app = await appWithKeys('front-end-key');

    await request(app)
      .get('/api/officegest/customers')
      .set('x-api-key', 'front-end-key')
      .expect(200);
  });

  it('accepts any of several configured keys, so one can be rotated at a time', async () => {
    const app = await appWithKeys('old-key,new-key');

    await request(app).get('/api/officegest/customers').set('x-api-key', 'new-key').expect(200);
  });

  it('leaves the health probe reachable, since a platform cannot send a key', async () => {
    const app = await appWithKeys('front-end-key');

    await request(app).get('/health').expect(200);
  });

  it('never echoes the offered key back to the caller', async () => {
    const app = await appWithKeys('front-end-key');

    const response = await request(app)
      .get('/api/officegest/customers')
      .set('x-api-key', 'guessed-value')
      .expect(401);

    expect(JSON.stringify(response.body)).not.toContain('guessed-value');
  });
});
