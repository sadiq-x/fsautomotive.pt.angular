/**
 * Route guards.
 *
 * These tests exist mainly to pin the `unknown` case: the guard must await the
 * session restore before deciding, or a hard refresh bounces a signed-in user
 * to the login page. That bug is invisible in manual testing on a warm app and
 * obvious to every user in production.
 */
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { delay, of } from 'rxjs';

import { AuthGateway } from '../auth/auth.gateway';
import type { SessionUser } from '../auth/auth.models';
import { PRIVATE_ROUTES } from '../config/private-routes.config';
import { authGuard, guestGuard, permissionGuard } from './auth.guard';

const USER: SessionUser = {
  id: '1',
  name: 'Miguel Faria',
  role: 'MANAGER',
  permissions: ['officegest.read'],
};

function configure(session: SessionUser | null): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthGateway,
        useValue: {
          login: () => of(USER),
          session: () => of(session),
          logout: () => of(undefined),
        },
      },
    ],
  });
}

/** Guards are `CanActivateFn`, so they need an injection context to run in. */
function run(guard: ReturnType<typeof permissionGuard>, url = '/gestao/clientes') {
  return TestBed.runInInjectionContext(() =>
    Promise.resolve(guard({} as never, { url } as never) as Promise<boolean | UrlTree>),
  );
}

describe('authGuard', () => {
  it('lets a signed-in user through', async () => {
    configure(USER);

    await expect(run(authGuard)).resolves.toBe(true);
  });

  it('sends an anonymous visitor to the login page', async () => {
    configure(null);

    const result = await run(authGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain(PRIVATE_ROUTES.login);
  });

  // Losing the requested URL means a bookmarked customer page dumps the user on
  // the dashboard after signing in.
  it('remembers where the visitor was going', async () => {
    configure(null);

    const result = await run(authGuard, '/gestao/clientes/42');
    const url = TestBed.inject(Router).serializeUrl(result as UrlTree);

    expect(url).toContain('redirect=%2Fgestao%2Fclientes%2F42');
  });

  it('waits for the session restore rather than deciding on `unknown`', async () => {
    // The gateway answers on a later tick; a guard that read the status
    // synchronously would see `unknown` and redirect.
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthGateway,
          useValue: {
            login: () => of(USER),
            session: () => of(USER).pipe(delay(5)),
            logout: () => of(undefined),
          },
        },
      ],
    });

    await expect(run(authGuard)).resolves.toBe(true);
  });
});

describe('guestGuard', () => {
  it('lets an anonymous visitor reach the login page', async () => {
    configure(null);

    await expect(run(guestGuard, PRIVATE_ROUTES.login)).resolves.toBe(true);
  });

  it('redirects a signed-in user away from the login page', async () => {
    configure(USER);

    const result = await run(guestGuard, PRIVATE_ROUTES.login);

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain(
      PRIVATE_ROUTES.dashboard,
    );
  });
});

describe('permissionGuard', () => {
  it('allows a user holding the permission', async () => {
    configure(USER);

    await expect(run(permissionGuard('officegest.customers.read'))).resolves.toBe(true);
  });

  it('sends a user without the permission back to the dashboard', async () => {
    configure(USER);

    const result = await run(permissionGuard('officegest.appointments.write'));

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain(
      PRIVATE_ROUTES.dashboard,
    );
  });

  it('sends an anonymous visitor to the login page, not the dashboard', async () => {
    configure(null);

    const result = await run(permissionGuard('officegest.read'));

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain(PRIVATE_ROUTES.login);
  });
});
