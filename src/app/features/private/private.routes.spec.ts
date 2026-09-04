/**
 * Where the private area sends people.
 *
 * The route table has two entries on the same `''` path — one `pathMatch:
 * 'full'` front door, one prefix route carrying the shell — and the whole
 * "always land on /gestao" contract depends on them resolving in that order.
 * That is not obvious from reading the config, so it is pinned here by
 * navigating for real.
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthGateway } from '../../core/auth/auth.gateway';
import type { SessionUser } from '../../core/auth/auth.models';
import { PRIVATE_ROUTES } from '../../core/config/private-routes.config';
import { privateRoutes } from './private.routes';

const USER: SessionUser = {
  id: 'u1',
  name: 'Miguel Faria',
  role: 'ADMIN',
  permissions: ['officegest.read', 'officegest.appointments.write'],
};

function configure(user: SessionUser | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'gestao', children: privateRoutes }]),
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
    it('shows the sign-in form at /gestao rather than bouncing onward', async () => {
      const router = configure(null);

      expect(await land(router, PRIVATE_ROUTES.base)).toBe(PRIVATE_ROUTES.base);
    });

    it.each([
      ['/gestao/painel'],
      ['/gestao/clientes'],
      ['/gestao/veiculos'],
      ['/gestao/folhas-de-obra'],
      ['/gestao/marcacoes'],
      ['/gestao/trabalhadores'],
      ['/gestao/configuracoes'],
      ['/gestao/uma-pagina-que-nao-existe'],
    ])('turns %s away to /gestao', async (target) => {
      const router = configure(null);

      expect(await land(router, target)).toContain(PRIVATE_ROUTES.base);
      expect(router.url.split('?')[0]).toBe(PRIVATE_ROUTES.base);
    });

    // The requested URL is deliberately dropped rather than carried in a
    // `?redirect=`: a bare `/gestao` is what a refused visitor should see, and
    // a parameter that is never produced or consumed cannot be abused.
    it('carries no query string when turning a visitor away', async () => {
      const router = configure(null);

      await land(router, '/gestao/clientes/42');

      expect(router.url).toBe(PRIVATE_ROUTES.base);
      expect(router.url).not.toContain('redirect');
    });

    it('still honours the old /gestao/entrar link', async () => {
      const router = configure(null);

      expect(await land(router, PRIVATE_ROUTES.legacyLogin)).toBe(PRIVATE_ROUTES.base);
    });
  });

  describe('signed in', () => {
    it('resolves /gestao on to the dashboard', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.base)).toBe(PRIVATE_ROUTES.dashboard);
    });

    it('sends the old login URL to the dashboard too, without stopping on a form', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.legacyLogin)).toBe(PRIVATE_ROUTES.dashboard);
    });

    it('lets a permitted page through untouched', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.customers)).toBe(PRIVATE_ROUTES.customers);
    });

    /**
     * The full refusal chain in one navigation: the permission guard turns the
     * request away to `/gestao`, which then resolves on to the dashboard
     * because the user *is* signed in. `USER` holds `officegest.read`, and the
     * umbrella is scoped to that namespace, so `workers.read` is genuinely not
     * granted.
     */
    it('routes a permission refusal through /gestao and on to the dashboard', async () => {
      const router = configure(USER);

      expect(await land(router, PRIVATE_ROUTES.workers)).toBe(PRIVATE_ROUTES.dashboard);
      expect(await land(router, PRIVATE_ROUTES.settings)).toBe(PRIVATE_ROUTES.dashboard);
    });

    it('falls back to the dashboard for an unknown private page', async () => {
      const router = configure(USER);

      expect(await land(router, '/gestao/nao-existe')).toBe(PRIVATE_ROUTES.dashboard);
    });
  });
});
