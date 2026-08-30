/**
 * The backend client, against `HttpTestingController`.
 *
 * Two things are worth pinning here, and neither is "does it call the URL":
 * that empty parameters are dropped rather than sent blank (the backend rejects
 * `search=` with a 422), and that the `{ data, meta }` envelope is unwrapped so
 * no component ever sees it.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import type { ApiSuccess } from '../../../../core/models';
import type { Customer } from '../models';
import { OfficeGestService } from './officegest.service';

const CUSTOMER: Customer = { id: '42', name: 'Ana Silva', taxId: '123456789' };

describe('OfficeGestService', () => {
  let service: OfficeGestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(OfficeGestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the envelope into items and pagination', async () => {
    const pending = firstValueFrom(service.listCustomers({ page: 1, perPage: 25 }));

    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/api/officegest/customers'),
    );
    expect(request.request.method).toBe('GET');

    request.flush({
      success: true,
      data: [CUSTOMER],
      meta: { page: 1, perPage: 25, total: 1, totalPages: 1 },
    } satisfies ApiSuccess<Customer[]>);

    await expect(pending).resolves.toEqual({
      items: [CUSTOMER],
      pagination: { page: 1, perPage: 25, total: 1, totalPages: 1 },
    });
  });

  it('sends the pagination and search parameters the backend expects', async () => {
    const pending = firstValueFrom(
      service.listCustomers({ page: 3, perPage: 50, search: 'silva' }),
    );

    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/api/officegest/customers'),
    );

    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('perPage')).toBe('50');
    expect(request.request.params.get('search')).toBe('silva');

    request.flush({ success: true, data: [], meta: { page: 3, perPage: 50 } });
    await pending;
  });

  // `search=` fails the backend's "2–120 characters" rule, so a cleared search
  // box has to omit the parameter rather than send it empty.
  it('omits empty parameters instead of sending blanks', async () => {
    const pending = firstValueFrom(
      service.listCustomers({ page: 1, perPage: 25, search: undefined }),
    );

    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/api/officegest/customers'),
    );

    expect(request.request.params.has('search')).toBe(false);

    request.flush({ success: true, data: [], meta: { page: 1, perPage: 25 } });
    await pending;
  });

  it('falls back to the requested page when the backend sends no meta', async () => {
    const pending = firstValueFrom(service.listVehicles({ page: 2, perPage: 10 }));

    http
      .expectOne((candidate) => candidate.url.endsWith('/api/officegest/vehicles'))
      .flush({ success: true, data: [] });

    await expect(pending).resolves.toMatchObject({ pagination: { page: 2, perPage: 10 } });
  });

  it('encodes an identifier into the path', async () => {
    const pending = firstValueFrom(service.getCustomer('a/b'));

    const request = http.expectOne((candidate) => candidate.url.includes('/customers/'));
    expect(request.request.url).toContain('a%2Fb');

    request.flush({ success: true, data: CUSTOMER });
    await pending;
  });

  it('posts an appointment and returns the created record', async () => {
    const body = { title: 'Revisão', startsAt: '2099-01-01T09:00:00.000Z' };
    const pending = firstValueFrom(service.createAppointment(body));

    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/api/officegest/appointments'),
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);

    request.flush({ success: true, data: { id: '900', title: 'Revisão' } });

    await expect(pending).resolves.toMatchObject({ id: '900' });
  });

  it('propagates a backend failure to the caller', async () => {
    const pending = firstValueFrom(service.getCustomer('999'));

    http
      .expectOne((candidate) => candidate.url.includes('/customers/'))
      .flush(
        {
          success: false,
          error: { code: 'OFFICEGEST_NOT_FOUND', message: 'nope' },
          requestId: 'r',
        },
        { status: 404, statusText: 'Not Found' },
      );

    await expect(pending).rejects.toBeTruthy();
  });
});
