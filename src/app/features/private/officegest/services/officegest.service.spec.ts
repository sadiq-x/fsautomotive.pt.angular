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

import { AuthGateway, AuthService } from '../../../../core/auth';
import { provideAuthStub, StubAuthGateway } from '../../../../core/auth/auth.testing';
import type { ApiSuccess } from '../../../../core/models';
import type { Customer, Employee } from '../models';
import { OfficeGestService } from './officegest.service';

const CUSTOMER: Customer = { id: '42', name: 'Ana Silva', taxId: '123456789' };

/** Everything `workers.read` exists to gate, on one record. */
const EMPLOYEE: Employee = {
  id: '7',
  name: 'Rui Martins',
  email: 'rui@fsautomotive.pt',
  phone: '912345678',
  login: 'rui',
};

const MANAGER = {
  id: 'user-1',
  name: 'Ana',
  role: 'MANAGER',
  permissions: ['workers.read'],
} as const;

const OPERATOR = {
  id: 'user-2',
  name: 'Bruno',
  role: 'USER',
  permissions: ['officegest.service-orders.read'],
} as const;

describe('OfficeGestService', () => {
  let service: OfficeGestService;
  let http: HttpTestingController;
  let auth: AuthService;
  let gateway: StubAuthGateway;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ...provideAuthStub()],
    });

    service = TestBed.inject(OfficeGestService);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    gateway = TestBed.inject(AuthGateway) as StubAuthGateway;
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
  describe('the roster cache is scoped to the signed-in account', () => {
    const ROSTER = { success: true, data: [EMPLOYEE], meta: null } as const;

    /** Signs an account in through the real service, as the login page does. */
    async function signIn(user: typeof MANAGER | typeof OPERATOR): Promise<void> {
      gateway.nextUser = { ...user };
      await auth.login({ email: `${user.name}@fsautomotive.pt`, password: 'x' });
    }

    function expectRosterRequest() {
      return http.expectOne((candidate) => candidate.url.endsWith('/api/officegest/employees'));
    }

    it('serves one request to the same account twice — the cache still works', async () => {
      await signIn(MANAGER);

      const first = firstValueFrom(service.employeesById());
      expectRosterRequest().flush(ROSTER);
      await first;

      // No second request: `expectNone` is the assertion, and `http.verify()`
      // in afterEach would fail if one were outstanding.
      const second = await firstValueFrom(service.employeesById());

      http.expectNone((candidate) => candidate.url.endsWith('/api/officegest/employees'));
      expect(second.get('7')?.email).toBe('rui@fsautomotive.pt');
    });

    /**
     * The regression this pair exists for.
     *
     * `OfficeGestService` is `providedIn: 'root'` and signing out does not
     * reload the page, so before the cache was keyed on the account the roster
     * one person fetched stayed in memory for whoever signed in next on the
     * same terminal — contact details included, and past the backend's 403.
     */
    it('does not serve a second account the roster the first one fetched', async () => {
      await signIn(MANAGER);

      const managerView = firstValueFrom(service.employeesById());
      expectRosterRequest().flush(ROSTER);
      expect((await managerView).size).toBe(1);

      await auth.logout();
      await signIn(OPERATOR);

      const operatorView = firstValueFrom(service.employeesById());

      // The assertion: a *new* request, rather than the previous account's map
      // replayed out of memory. The backend answers this one with a 403.
      expectRosterRequest().flush(
        { success: false, error: { code: 'FORBIDDEN', message: 'Sem permissão.' } },
        { status: 403, statusText: 'Forbidden' },
      );

      await expect(operatorView).resolves.toEqual(new Map());
    });

    it('drops the cache on sign-out even when nobody signs in after', async () => {
      await signIn(MANAGER);

      const view = firstValueFrom(service.employeesById());
      expectRosterRequest().flush(ROSTER);
      await view;

      await auth.logout();

      const afterSignOut = firstValueFrom(service.employeesById());
      expectRosterRequest().flush({ success: true, data: [], meta: null });

      await expect(afterSignOut).resolves.toEqual(new Map());
    });
  });
});
