/**
 * The private area's URL layout, in one place.
 *
 * Guards, the sidebar, the login redirect and the pages themselves all need
 * these paths. Defined once so a rename is a single edit, and so no template
 * contains a hand-typed `/private/...` that a refactor can miss.
 *
 * WHY ENGLISH, WHEN THE PUBLIC SITE IS PORTUGUESE
 * -----------------------------------------------
 * The public routes (`/sobre-nos`, `/servicos`, `/contactos`) are the ones
 * customers see, share and search for, so they stay in the language of the
 * site. The private area is a tool used by three members of staff and is
 * `noindex` everywhere: naming it in English keeps the two spaces visibly
 * separate — a URL either starts with `/private` and is a management screen, or
 * it does not. The *interface* remains Portuguese; only the addresses changed.
 */
import type { Routes } from '@angular/router';

export const PRIVATE_BASE = '/private';

export const PRIVATE_ROUTES = {
  base: PRIVATE_BASE,
  /**
   * The sign-in screen, and the only place a refusal lands.
   *
   * Every refusal in the private area points here: the auth guard, the
   * permission guard, the 401 handler and sign-out all navigate to
   * `PRIVATE_ROUTES.login`, so there is exactly one URL a user can be turned
   * away to. `guestGuard` resolves it in both directions — the form when
   * anonymous, the dashboard when not — which is what lets it be the entry
   * point *and* the redirect target without ever looping.
   */
  login: `${PRIVATE_BASE}/login`,
  dashboard: `${PRIVATE_BASE}/dashboard`,
  customers: `${PRIVATE_BASE}/customers`,
  customer: (id: string) => `${PRIVATE_BASE}/customers/${encodeURIComponent(id)}`,
  vehicles: `${PRIVATE_BASE}/vehicles`,
  vehicle: (plate: string) => `${PRIVATE_BASE}/vehicles/${encodeURIComponent(plate)}`,
  serviceOrders: `${PRIVATE_BASE}/service-orders`,
  serviceOrder: (id: string) => `${PRIVATE_BASE}/service-orders/${encodeURIComponent(id)}`,
  appointments: `${PRIVATE_BASE}/appointments`,
  appointment: (id: string) => `${PRIVATE_BASE}/appointments/${encodeURIComponent(id)}`,
  workers: `${PRIVATE_BASE}/workers`,
  settings: `${PRIVATE_BASE}/settings`,
} as const;

/**
 * The previous `/gestao/...` addresses, mapped onto the new ones.
 *
 * The area moved from `/gestao` to `/private`; the staff who use it every day
 * have the old URLs bookmarked, and a bookmark that 404s reads as an outage.
 * Kept in the same spirit as the public site's `/home` and `/sobrenos`
 * redirects — the difference being that these carry their parameters through,
 * so a bookmarked customer or work order reopens on that record rather than on
 * the dashboard.
 *
 * `pathMatch: 'full'` on every entry: without it `clientes` would also match
 * `clientes/42` and drop the id on the way past.
 *
 * These are eager route *data*, not components, so they cost the public bundle
 * nothing beyond their own bytes. Delete the block once the old links have
 * fallen out of use.
 */
export const LEGACY_PRIVATE_ROUTES: Routes = [
  { path: 'gestao', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.login },
  {
    path: 'gestao',
    children: [
      { path: 'entrar', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.login },
      { path: 'painel', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.dashboard },

      { path: 'clientes', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.customers },
      {
        path: 'clientes/:customerId',
        pathMatch: 'full',
        redirectTo: `${PRIVATE_BASE}/customers/:customerId`,
      },

      { path: 'veiculos', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.vehicles },
      { path: 'veiculos/:plate', pathMatch: 'full', redirectTo: `${PRIVATE_BASE}/vehicles/:plate` },

      { path: 'folhas-de-obra', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.serviceOrders },
      {
        path: 'folhas-de-obra/:serviceOrderId',
        pathMatch: 'full',
        redirectTo: `${PRIVATE_BASE}/service-orders/:serviceOrderId`,
      },

      // `nova` before `:appointmentId`, or this would redirect to an
      // appointment whose id is the literal "nova".
      //
      // Booking from the site was removed, so the old "nova marcação" address
      // has no destination of its own any more. It lands on the list rather
      // than being deleted outright: a bookmark from the previous site should
      // arrive somewhere useful, not on "esta marcação não existe".
      { path: 'marcacoes/nova', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.appointments },
      { path: 'marcacoes', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.appointments },
      {
        path: 'marcacoes/:appointmentId',
        pathMatch: 'full',
        redirectTo: `${PRIVATE_BASE}/appointments/:appointmentId`,
      },

      { path: 'trabalhadores', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.workers },
      { path: 'configuracoes', pathMatch: 'full', redirectTo: PRIVATE_ROUTES.settings },

      /* Anything else that used to live under `/gestao` goes to the front door. */
      { path: '**', redirectTo: PRIVATE_ROUTES.login },
    ],
  },
];
