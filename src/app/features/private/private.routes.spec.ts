/**
 * Where the private area sends people.
 *
 * The route table has three entries competing for the first segment — a
 * `pathMatch: 'full'` redirect on `''`, the login page, and a prefix route
 * carrying the shell — and the whole "always land on /private/login" contract
 * depends on them resolving in that order. That is not obvious from reading the
 * config, so it is pinned here by navigating for real.
 *
 * The legacy `/gestao/...` block is mounted alongside, the way `app.routes.ts`
 * mounts it, because a redirect that quietly stops working is indistinguishable
 * from a dead bookmark.
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthGateway } from '../../core/auth/auth.gateway';
import type { SessionUser } from '../../core/auth/auth.models';
import { LEGACY_PRIVATE_ROUTES, PRIVATE_ROUTES } from '../../core/config/private-routes.config';
import { privateRoutes } from './private.routes';

const USER: SessionUser = {
  id: 'u1',
  name: 'Miguel Faria',
  role: 'ADMIN',
  permissions: ['officegest.read', 'officegest.write'],
};

function configure(user: SessionUser | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([...LEGACY_PRIVATE_ROUTES, { path: 'private', children: privateRoutes }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: AuthGateway,
        useValue: {
          login: () => of(user),
          session: () => of(user),
          logout: () => of(undefined),
        },
      },
    ],
  });

  return TestBed.inject(Router);
}

/** Navigates and reports where the router actually settled. */
async function land(router: Router, url: string): Promise<string> {
  await router.navigateByUrl(url);
  return router.url;
}

describe('private routes', () => {
  describe('anonymous', () => {
    it('shows the sign-in form at /private/login rather than bouncing onward', async () => {
      const router = configure(null);

      expect(await land(router, PRIVATE_ROUTES.login)).toBe(PRIVATE_ROUTES.login);
    });

    // `/private` is the name of the area, not a page: it hands over to the
    // front door rather than 404ing or reaching a protected route.
    it('sends the bare area root to the front door', async () => {
      const router = configure(null);

      expect(await land(router, PRIVATE_ROUTES.base)).toBe(PRIVATE_ROUTES.login);
    });

    it.each([
      ['/private/dashboard'],
      ['/private/customers'],
      ['/private/vehicles'],
      ['/private/service-orders'],
      ['/private/appointments'],
      ['/private/workers'],
      ['/private/settings'],
      ['/private/uma-pagina-que-nao-existe'],
    ])('turns %s away to /private/login', async (target) => {
      const router = configure(null);

      expect(await land(router, target)).toBe(PRIVATE_ROUTES.login);
    });

    // The requested URL is deliberately dropped rather than carried in a
    // `?redirect=`: a bare `/private/login` is what a refused visitor should
    // see, and a parameter that is never produced or consumed cannot be abused.
    it('carries no query string when turning a visitor away', async () => {
      const router = configure(null);

      await land(router, '/private/customers/42');

      expect(router.url).toBe(PRIVATE_ROUTES.login);
      expect(router.url).not.toContain('redirect');
    });
  });

  describe('signed in', () => {
    it('resolves the login page on to the dashboard', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.login)).toBe(PRIVATE_ROUTES.dashboard);
    });

    it('resolves the bare area root on to the dashboard', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.base)).toBe(PRIVATE_ROUTES.dashboard);
    });

    it('lets a permitted page through untouched', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.customers)).toBe(PRIVATE_ROUTES.customers);
    });

    /**
     * The full refusal chain in one navigation: the permission guard turns the
     * request away to `/private/login`, which then resolves on to the dashboard
     * because the user *is* signed in. `USER` holds `officegest.read`, and the
     * umbrella is scoped to that namespace, so `workers.read` is genuinely not
     * granted.
     */
    it('routes a permission refusal through the front door to the dashboard', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.workers)).toBe(PRIVATE_ROUTES.dashboard);
      expect(await land(router, PRIVATE_ROUTES.settings)).toBe(PRIVATE_ROUTES.dashboard);
    });

    it('falls back to the dashboard for an unknown private page', async () => {
      const router = configure(USER);

      expect(await land(router, '/private/nao-existe')).toBe(PRIVATE_ROUTES.dashboard);
    });
  });

  /**
   * The area used to live at `/gestao`. Every old address still resolves, and
   * the parameterised ones carry their record through — a bookmarked customer
   * reopens on that customer, not on the dashboard.
   */
  describe('the old /gestao addresses', () => {
    it.each([
      ['/gestao', PRIVATE_ROUTES.login],
      ['/gestao/entrar', PRIVATE_ROUTES.login],
      ['/gestao/nada-disto-existe', PRIVATE_ROUTES.login],
    ])('sends an anonymous visitor from %s to %s', async (from, to) => {
      const router = configure(null);

      expect(await land(router, from)).toBe(to);
    });

    it.each([
      ['/gestao/painel', PRIVATE_ROUTES.dashboard],
      ['/gestao/clientes', PRIVATE_ROUTES.customers],
      ['/gestao/veiculos', PRIVATE_ROUTES.vehicles],
      ['/gestao/folhas-de-obra', PRIVATE_ROUTES.serviceOrders],
      ['/gestao/marcacoes', PRIVATE_ROUTES.appointments],
    ])('maps %s to %s', async (from, to) => {
      const router = configure(USER);

      expect(await land(router, from)).toBe(to);
    });

    it.each([
      ['/gestao/clientes/42', PRIVATE_ROUTES.customer('42')],
      ['/gestao/veiculos/AA-00-BB', PRIVATE_ROUTES.vehicle('AA-00-BB')],
      ['/gestao/folhas-de-obra/7', PRIVATE_ROUTES.serviceOrder('7')],
      ['/gestao/marcacoes/9', PRIVATE_ROUTES.appointment('9')],
    ])('carries the record identifier from %s through to %s', async (from, to) => {
      const router = configure(USER);

      expect(await land(router, from)).toBe(to);
    });

    // `nova` is declared before `:appointmentId` in both tables; getting that
    // order wrong turns the "new appointment" link into a lookup for a booking
    // with the id "nova".
    /**
     * Booking from the site was removed, so `/gestao/marcacoes/nova` has no
     * destination of its own — but it must still not be read as an appointment
     * whose id is "nova", which is what the route ordering guarantees.
     */
    it('does not mistake the old "nova" link for an appointment id', async () => {
      const router = configure(USER);

      expect(await land(router, '/gestao/marcacoes/nova')).toBe(PRIVATE_ROUTES.appointments);
    });
  });
});
