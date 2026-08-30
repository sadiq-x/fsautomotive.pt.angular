/**
 * The service end to end, over real HTTP, with only `fetch` faked.
 *
 * WHY THESE EXIST ON TOP OF THE UNIT TESTS
 * ----------------------------------------
 * Middleware order, the response envelope and the status mapping are properties
 * of the assembled application, not of any one class — a unit test cannot see
 * that validation runs before the controller, or that an upstream 401 comes out
 * as 502. This is also where the security claims are checked as behaviour: the
 * credential must not appear in any response, whatever goes wrong.
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { createContainer } from '../src/container.js';
import { fakeFetch, LOGIN_OK, type CannedResponse } from './officegest-fetch.js';

/** Builds the whole application on top of a scripted upstream. */
function appWith(script: readonly CannedResponse[]) {
  const http = fakeFetch(script);
  const container = createContainer({ fetch: http.fetch, sleep: async () => undefined });

  return { app: createApp(container), http };
}

const CUSTOMER_PAGE: CannedResponse = {
  body: {
    data: [{ id: '42', nome: 'Ana Silva', nif: '123456789' }],
    meta: { current_page: 1, total: 1 },
  },
};

describe('GET /health', () => {
  it('answers without contacting OfficeGest', async () => {
    const { app, http } = appWith([]);

    const response = await request(app).get('/health').expect(200);

    expect(response.body).toMatchObject({ success: true, data: { status: 'ok' } });
    expect(http.calls).toHaveLength(0);
  });

  it('never reveals the credential, only the tenant it points at', async () => {
    const { app } = appWith([]);

    const response = await request(app).get('/health').expect(200);

    expect(JSON.stringify(response.body)).not.toContain('not-a-real-key');
    expect(response.body.data.officegest.baseUrl).toBe('https://tenant.example.test/api/v2');
  });
});

describe('GET /api/officegest/customers', () => {
  it('returns the mapped customers and our pagination', async () => {
    const { app } = appWith([LOGIN_OK, CUSTOMER_PAGE]);

    const response = await request(app).get('/api/officegest/customers').expect(200);

    expect(response.body).toEqual({
      success: true,
      data: [{ id: '42', name: 'Ana Silva', taxId: '123456789' }],
      meta: { page: 1, perPage: 25, total: 1, totalPages: 1 },
    });
  });

  it('passes validated pagination through to the upstream query', async () => {
    const { app, http } = appWith([LOGIN_OK, CUSTOMER_PAGE]);

    await request(app).get('/api/officegest/customers?page=2&perPage=5&search=silva').expect(200);

    expect(http.apiCalls()[0]?.url).toContain('page=2');
    expect(http.apiCalls()[0]?.url).toContain('per_page=5');
    expect(http.apiCalls()[0]?.url).toContain('search=silva');
  });

  it('rejects a page size above the cap before any upstream call', async () => {
    const { app, http } = appWith([LOGIN_OK, CUSTOMER_PAGE]);

    const response = await request(app).get('/api/officegest/customers?perPage=5000').expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toContainEqual(
      expect.objectContaining({ source: 'query', field: 'perPage' }),
    );
    expect(http.calls).toHaveLength(0);
  });

  it('rejects a one-character search term', async () => {
    const { app } = appWith([LOGIN_OK, CUSTOMER_PAGE]);

    await request(app).get('/api/officegest/customers?search=a').expect(422);
  });

  it('echoes the request id so a caller can quote it', async () => {
    const { app } = appWith([LOGIN_OK, CUSTOMER_PAGE]);

    const response = await request(app)
      .get('/api/officegest/customers')
      .set('x-request-id', 'trace-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('trace-123');
  });
});

describe('GET /api/officegest/vehicles/:plate', () => {
  it('normalises the plate before using it as the upstream key', async () => {
    const { app, http } = appWith([LOGIN_OK, { body: { data: { matricula: 'aa-00-bb' } } }]);

    const response = await request(app).get('/api/officegest/vehicles/aa-00-bb').expect(200);

    expect(http.apiCalls()[0]?.url).toBe(
      'https://tenant.example.test/api/v2/workshop/vehicles/AA00BB',
    );
    expect(response.body.data.plate).toBe('AA00BB');
  });

  it('rejects something that is not a plate', async () => {
    const { app, http } = appWith([LOGIN_OK]);

    await request(app).get('/api/officegest/vehicles/not-a-plate').expect(422);
    expect(http.calls).toHaveLength(0);
  });
});

describe('POST /api/officegest/appointments', () => {
  it('creates a booking and points at it with Location', async () => {
    const { app, http } = appWith([LOGIN_OK, { status: 201, body: { data: { id: '900' } } }]);

    const response = await request(app)
      .post('/api/officegest/appointments')
      .send({ title: 'Revisão dos 60.000 km', startsAt: '2099-01-01T09:00:00.000Z' })
      .expect(201);

    expect(response.body).toEqual({ success: true, data: { id: '900' } });
    expect(response.headers['location']).toBe('/api/officegest/appointments/900');
    expect(http.apiCalls()[0]?.body).toEqual({
      title: 'Revisão dos 60.000 km',
      start_date: '2099-01-01T09:00:00.000Z',
    });
  });

  it('rejects a body that fails validation, listing every problem', async () => {
    const { app, http } = appWith([LOGIN_OK]);

    const response = await request(app)
      .post('/api/officegest/appointments')
      .send({ title: 'no', startsAt: 'yesterday' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThanOrEqual(2);
    expect(http.calls).toHaveLength(0);
  });

  it('rejects a booking in the past as a business-rule failure, not a schema one', async () => {
    const { app } = appWith([LOGIN_OK]);

    const response = await request(app)
      .post('/api/officegest/appointments')
      .send({ title: 'Revisão atrasada', startsAt: '2020-01-01T09:00:00.000Z' })
      .expect(400);

    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('refuses a body larger than the configured limit', async () => {
    const { app } = appWith([LOGIN_OK]);

    await request(app)
      .post('/api/officegest/appointments')
      .send({ title: 'x'.repeat(200_000), startsAt: '2099-01-01T09:00:00.000Z' })
      .expect(413);
  });
});

describe('upstream failures', () => {
  it('passes a genuine upstream 404 through to the caller', async () => {
    const { app } = appWith([LOGIN_OK, { status: 404 }]);

    const response = await request(app).get('/api/officegest/customers/999').expect(404);

    expect(response.body.error.code).toBe('OFFICEGEST_NOT_FOUND');
  });

  it('reports a rejected OfficeGest credential as 502, not 401', async () => {
    // The caller did nothing wrong: this is our misconfiguration, and answering
    // 401 would tell the browser to prompt for credentials it cannot supply.
    const { app } = appWith([LOGIN_OK, { status: 401 }, LOGIN_OK, { status: 401 }]);

    const response = await request(app).get('/api/officegest/customers').expect(502);

    expect(response.body.error.code).toBe('OFFICEGEST_AUTH_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('not-a-real-key');
  });

  it('reports a missing OfficeGest permission as 502', async () => {
    const { app } = appWith([LOGIN_OK, { status: 403 }]);

    const response = await request(app).get('/api/officegest/customers').expect(502);

    expect(response.body.error.code).toBe('OFFICEGEST_FORBIDDEN');
  });

  it('reports an unreachable upstream as 502', async () => {
    const { app } = appWith([LOGIN_OK, { networkError: new TypeError('fetch failed') }]);

    const response = await request(app).get('/api/officegest/customers').expect(502);

    expect(response.body.error.code).toBe('OFFICEGEST_UNAVAILABLE');
  });

  it('forwards an upstream 422 with the field errors that help the caller', async () => {
    const { app } = appWith([
      LOGIN_OK,
      { status: 422, body: { errors: { start_date: ['is required'] } } },
    ]);

    const response = await request(app)
      .post('/api/officegest/appointments')
      .send({ title: 'Revisão', startsAt: '2099-01-01T09:00:00.000Z' })
      .expect(422);

    expect(response.body.error.code).toBe('OFFICEGEST_VALIDATION_ERROR');
    expect(response.body.error.details).toEqual({ start_date: ['is required'] });
  });

  it('reports a response that is not JSON as a contract failure', async () => {
    const { app } = appWith([LOGIN_OK, { text: '<html>oops</html>', contentType: 'text/html' }]);

    const response = await request(app).get('/api/officegest/customers').expect(502);

    expect(response.body.error.code).toBe('OFFICEGEST_MALFORMED_RESPONSE');
  });

  it('sets Retry-After when OfficeGest rate limits the integration', async () => {
    const { app } = appWith([LOGIN_OK, { status: 429, headers: { 'retry-after': '11' } }]);

    const response = await request(app).get('/api/officegest/customers').expect(429);

    expect(response.headers['retry-after']).toBe('11');
    expect(response.body.error.code).toBe('OFFICEGEST_RATE_LIMITED');
  });
});

describe('routing and error shape', () => {
  it('answers an unknown route with the same envelope as everything else', async () => {
    const { app } = appWith([]);

    const response = await request(app).get('/api/officegest/nope').expect(404);

    expect(response.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
    expect(response.body.requestId).toEqual(expect.any(String));
  });

  it('rejects a malformed JSON body with 400 rather than crashing', async () => {
    const { app } = appWith([]);

    const response = await request(app)
      .post('/api/officegest/appointments')
      .set('content-type', 'application/json')
      .send('{ not json')
      .expect(400);

    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('does not advertise the framework', async () => {
    const { app } = appWith([]);

    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
