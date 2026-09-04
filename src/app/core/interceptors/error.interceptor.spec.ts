/**
 * The cross-cutting error rules, exercised through a real `HttpClient`.
 *
 * What matters here is not that an error is thrown — it is *what* reaches the
 * component. Every case below is a decision that would otherwise be repeated,
 * and eventually got wrong, in each service.
 */
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';

import { AuthGateway } from '../auth/auth.gateway';
import { AuthService } from '../auth/auth.service';
import type { SessionUser } from '../auth/auth.models';
import { ApiError } from '../models/api.model';
import { NotificationService } from '../services/notification.service';
import { EXPECTS_UNAUTHORIZED, REPORTS_OWN_ERRORS, apiInterceptor } from './api.interceptor';
import { errorInterceptor } from './error.interceptor';

const USER: SessionUser = { id: '1', name: 'Ana', role: 'ADMIN', permissions: ['officegest.read'] };

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let notifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthGateway,
          useValue: { login: () => of(USER), session: () => of(USER), logout: () => of(undefined) },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    notifications = TestBed.inject(NotificationService);
  });

  afterEach(() => backend.verify());

  function fail(status: number, body: object | string | null = null): Promise<unknown> {
    const pending = firstValueFrom(http.get('/api/officegest/customers'));

    backend
      .expectOne((request) => request.url.endsWith('/api/officegest/customers'))
      .flush(body, { status, statusText: 'Error' });

    return pending;
  }

  it('turns the backend envelope into an ApiError the UI can render', async () => {
    const pending = fail(422, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: 'page' }],
      },
      requestId: 'req-1',
    });

    await expect(pending).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Pedido inválido.',
      requestId: 'req-1',
    });
  });

  // The backend's 5xx wording is deliberately generic; ours is friendlier and
  // in the same language as the rest of the site.
  it('replaces a 502 message with one written for a person', async () => {
    const pending = fail(502, {
      success: false,
      error: {
        code: 'OFFICEGEST_UNAVAILABLE',
        message: 'Unable to retrieve data from OfficeGest.',
      },
      requestId: 'req-2',
    });

    await expect(pending).rejects.toMatchObject({
      status: 502,
      message: 'O serviço OfficeGest está indisponível de momento.',
    });
  });

  it('handles a failure with no envelope at all, such as a proxy error page', async () => {
    await expect(fail(503, '<html>gateway</html>')).rejects.toBeInstanceOf(ApiError);
  });

  it('announces faults the user cannot act on', async () => {
    await fail(500, null).catch(() => undefined);

    expect(notifications.notifications().some((item) => item.tone === 'error')).toBe(true);
  });

  // A 404 belongs to the page that asked; a toast for it would be noise on top
  // of the empty state the page already shows.
  it('stays quiet for errors the page handles itself', async () => {
    await fail(404, null).catch(() => undefined);

    expect(notifications.notifications()).toHaveLength(0);
  });

  // The diagnostics page reports an outage in place; a toast repeating it would
  // fire again on every re-check.
  it('stays quiet when the caller reports its own failure', async () => {
    const pending = firstValueFrom(
      http.get('/api/officegest/customers', {
        context: new HttpContext().set(REPORTS_OWN_ERRORS, true),
      }),
    );

    backend
      .expectOne((request) => request.url.endsWith('/api/officegest/customers'))
      .flush(null, { status: 500, statusText: 'Error' });

    await pending.catch(() => undefined);

    expect(notifications.notifications()).toHaveLength(0);
  });

  it('still rejects with an ApiError when the caller reports its own failure', async () => {
    const pending = firstValueFrom(
      http.get('/api/officegest/customers', {
        context: new HttpContext().set(REPORTS_OWN_ERRORS, true),
      }),
    );

    backend
      .expectOne((request) => request.url.endsWith('/api/officegest/customers'))
      .flush(null, { status: 500, statusText: 'Error' });

    await expect(pending).rejects.toBeInstanceOf(ApiError);
  });

  describe('401 handling', () => {
    it('ends the session and redirects to the login page', async () => {
      const auth = TestBed.inject(AuthService);
      await auth.restore();
      expect(auth.isAuthenticated()).toBe(true);

      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      await fail(401, null).catch(() => undefined);

      expect(auth.status()).toBe('anonymous');
      expect(navigate).toHaveBeenCalled();
    });

    // The start-up session probe answers 401 for every anonymous visitor.
    // Treating that as an expiry would redirect them the moment they arrive.
    it('leaves the session probe alone', async () => {
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const pending = firstValueFrom(
        http.get('/api/auth/session', {
          context: new HttpContext().set(EXPECTS_UNAUTHORIZED, true),
        }),
      );

      backend
        .expectOne((request) => request.url.endsWith('/api/auth/session'))
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      await pending.catch(() => undefined);

      expect(navigate).not.toHaveBeenCalled();
    });
  });
});

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  // The session cookie is HttpOnly, so the browser only attaches it
  // cross-origin when the request asks for credentials.
  it('sends credentials with backend requests', () => {
    void firstValueFrom(http.get('/api/officegest/customers'));

    const request = backend.expectOne((candidate) => candidate.url.endsWith('/customers'));
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, data: [] });
  });

  it('leaves requests that are not ours untouched', () => {
    void firstValueFrom(http.get('https://example.test/thing'));

    const request = backend.expectOne('https://example.test/thing');
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });
});
