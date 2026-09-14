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
    // `limit`, not `per_page`. The Laravel-shaped envelope made `per_page` the
    // obvious inference and it was wrong: the API ignores it silently and
    // returns a fixed 15 rows, so the page-size control moved a label and
    // nothing else. Confirmed against the tenant on 2026-09-07.
    expect(http.apiCalls()[0]?.url).toContain('limit=5');
    expect(http.apiCalls()[0]?.url).not.toContain('per_page');
    // `name=`, not `search=`. Upstream has no free-text search; it ignored
    // `search` silently, which is why the box appeared to do nothing.
    expect(http.apiCalls()[0]?.url).toContain('name=silva');
    expect(http.apiCalls()[0]?.url).not.toContain('search=');
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
  /**
   * The regression this pins.
   *
   * This test previously asserted that the *normalised* plate was sent
   * upstream, which is what the code did and what made every vehicle detail
   * page report "not found": OfficeGest keys vehicles by the hyphenated plate
   * and answers 404 for `0000ZZ` while returning the record for `00-00-ZZ`
   * (verified against the tenant, 2026-09-08).
   *
   * Both halves matter, which is why they are asserted together: hyphenated on
   * the way out, normalised on the way back, whatever the caller typed.
   */
  it.each(['aa-00-bb', 'AA00BB', 'aa 00 bb'])(
    'sends the hyphenated plate upstream and answers with the normalised one (%s)',
    async (typed) => {
      const { app, http } = appWith([LOGIN_OK, { body: { data: { matricula: 'aa-00-bb' } } }]);

      const response = await request(app).get(`/api/officegest/vehicles/${typed}`).expect(200);

      expect(http.apiCalls()[0]?.url).toBe(
        'https://tenant.example.test/api/v2/workshop/vehicles/AA-00-BB',
      );
      expect(response.body.data.plate).toBe('AA00BB');
    },
  );

  it('rejects something that is not a plate', async () => {
    const { app, http } = appWith([LOGIN_OK]);

    await request(app).get('/api/officegest/vehicles/not-a-plate').expect(422);
    expect(http.calls).toHaveLength(0);
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
      { status: 422, body: { errors: { start: ['is required'] } } },
    ]);

    const response = await request(app).get('/api/officegest/appointments').expect(422);

    expect(response.body.error.code).toBe('OFFICEGEST_VALIDATION_ERROR');
    expect(response.body.error.details).toEqual({ start: ['is required'] });
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

describe('GET /api/officegest/workshop-monitor', () => {
  /** One active job, in the shape the monitor endpoint actually returns. */
  const BOARD_PAGE: CannedResponse = {
    body: {
      data: [
        {
          number: 4821,
          document_number: 'OSV BF2026/12',
          status: 'EXE',
          date: '2026-09-13',
          vehicle_plate: '61-SQ-64',
          vehicle: { plate: '61-SQ-64', brand_name: 'Renault', model_name: 'Clio' },
          completion_percentage: 40,
          interventions: [{ sequence_number: 1, intervention: 'Travões', completed: true }],
          mechanics: [{ employee_code: 7, name: 'João', start_time: '2026-09-13 08:15:00' }],
        },
      ],
      meta: { current_page: 1, per_page: 250, has_more: false },
    },
  };

  it('returns the board, with the clock-on the whole feature depends on', async () => {
    const { app } = appWith([LOGIN_OK, BOARD_PAGE]);

    const response = await request(app).get('/api/officegest/workshop-monitor').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.activeMechanicCount).toBe(1);
    expect(response.body.data.observedAt).toEqual(expect.any(String));
    expect(response.body.data.serviceOrders).toHaveLength(1);
    expect(response.body.data.serviceOrders[0]).toMatchObject({
      id: '4821',
      documentNumber: 'OSV BF2026/12',
      status: 'EXE',
      // Normalised here, hyphenated upstream — see the mapper.
      plate: '61SQ64',
      completionPercentage: 0.4,
      mechanics: [{ employeeCode: '7', name: 'João' }],
    });
  });

  /**
   * No `meta` on this response. A board is not a page of a list, and a
   * pagination envelope here would describe something that does not exist.
   */
  it('sends no pagination envelope', async () => {
    const { app } = appWith([LOGIN_OK, BOARD_PAGE]);

    const response = await request(app).get('/api/officegest/workshop-monitor').expect(200);

    expect(response.body.meta).toBeUndefined();
  });

  /** A cached board in a browser would show a timer that had silently stopped. */
  it('forbids the browser from caching a live board', async () => {
    const { app } = appWith([LOGIN_OK, BOARD_PAGE]);

    const response = await request(app).get('/api/officegest/workshop-monitor').expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('sends the plate hyphenated and the shop calendar upstream', async () => {
    const { app, http } = appWith([LOGIN_OK, BOARD_PAGE]);

    await request(app)
      .get('/api/officegest/workshop-monitor?plate=61sq64&startHour=08:30&skipWeekends=true')
      .expect(200);

    // Found by path, not by position: a board request also fetches the mechanic
    // roster, and the two are issued concurrently, so which lands last is not
    // something this test should depend on.
    const url = http.calls.find((call) => call.url.includes('/workshop/monitor'))?.url ?? '';

    expect(url).toContain('/workshop/monitor/service-orders');
    expect(url).toContain('vehicle_plate=61-SQ-64');
    expect(url).toContain('start_hour=08%3A30');
    expect(url).toContain('skip_weekends=1');
  });

  /**
   * The other half of "who is working on what": the people who are not at a
   * car. The mapping itself is covered in the service spec — the canned
   * upstream here is sequential, so the body this call receives is not
   * meaningful. What matters at this layer is that the request is made at all.
   */
  it('reads the mechanic roster alongside the board', async () => {
    const { app, http } = appWith([LOGIN_OK, BOARD_PAGE]);

    await request(app).get('/api/officegest/workshop-monitor').expect(200);

    expect(http.calls.some((call) => call.url.includes('/workshop/mechanics'))).toBe(true);
  });

  it('rejects a nonsensical working hour before calling upstream', async () => {
    const { app, http } = appWith([]);

    const response = await request(app)
      .get('/api/officegest/workshop-monitor?startHour=25:99')
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(http.calls).toHaveLength(0);
  });
});
