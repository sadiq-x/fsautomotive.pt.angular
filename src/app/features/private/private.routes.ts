/**
 * The private area's routes.
 *
 * WHY A SEPARATE ROUTE FILE
 * -------------------------
 * `app.routes.ts` stays a readable list of the public site's four pages, with
 * one lazy entry pointing here. The whole private area — shell, pages,
 * components, the OfficeGest service — then ships as its own chunk that a
 * visitor to the public site never downloads.
 *
 * GUARDS AND `data.meta`
 * ----------------------
 * `authGuard` sits on the parent route, so every child inherits it and a page
 * added later is protected by default rather than by remembering. Permission
 * guards sit on the individual routes, because they differ per resource.
 *
 * Every route carries `meta` like the public ones, since `App` feeds it to
 * `SeoService` on each navigation — but with `noIndex`, because a management
 * area has no business in a search index.
 */
import type { Routes } from '@angular/router';

import type { PageMeta } from '../../core/models';
import { authGuard, guestGuard, permissionGuard } from '../../core/guards/auth.guard';

/** Private pages are never indexed, and their titles are never public copy. */
function privateMeta(title: string, path: string): PageMeta {
  return {
    title,
    description: 'Área reservada à equipa da FS Automotive.',
    path,
    noIndex: true,
  };
}

export const privateRoutes: Routes = [
  /**
   * `/gestao` is the front door, and the only place a refused request lands.
   *
   * `guestGuard` decides what it shows: the sign-in form for an anonymous
   * visitor, or a redirect to the dashboard for someone already signed in.
   * Because the guard resolves it both ways, every guard, the 401 handler and
   * sign-out can point at this one URL without risking a redirect loop —
   * whereas a static `redirectTo: 'painel'` here would bounce an anonymous
   * visitor into a protected route just to be turned away again.
   *
   * `pathMatch: 'full'` is what keeps this to `/gestao` exactly and leaves
   * `/gestao/<anything>` to the shell route below.
   */
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
    data: { meta: privateMeta('Entrar', '/gestao') },
  },

  /* The login used to live here; keep old links and bookmarks working. */
  { path: 'entrar', pathMatch: 'full', redirectTo: '' },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/private-shell').then((m) => m.PrivateShell),
    children: [
      {
        path: 'painel',
        loadComponent: () =>
          import('./officegest/pages/dashboard/dashboard').then((m) => m.Dashboard),
        data: { meta: privateMeta('Painel', '/gestao/painel') },
      },

      {
        path: 'clientes',
        canActivate: [permissionGuard('officegest.customers.read')],
        loadComponent: () =>
          import('./officegest/pages/customers/customers').then((m) => m.Customers),
        data: { meta: privateMeta('Clientes', '/gestao/clientes') },
      },
      {
        path: 'clientes/:customerId',
        canActivate: [permissionGuard('officegest.customers.read')],
        loadComponent: () =>
          import('./officegest/pages/customers/customer-detail').then((m) => m.CustomerDetail),
        data: { meta: privateMeta('Cliente', '/gestao/clientes') },
      },

      {
        path: 'veiculos',
        canActivate: [permissionGuard('officegest.vehicles.read')],
        loadComponent: () => import('./officegest/pages/vehicles/vehicles').then((m) => m.Vehicles),
        data: { meta: privateMeta('Veículos', '/gestao/veiculos') },
      },
      {
        path: 'veiculos/:plate',
        canActivate: [permissionGuard('officegest.vehicles.read')],
        loadComponent: () =>
          import('./officegest/pages/vehicles/vehicle-detail').then((m) => m.VehicleDetail),
        data: { meta: privateMeta('Veículo', '/gestao/veiculos') },
      },

      {
        path: 'folhas-de-obra',
        canActivate: [permissionGuard('officegest.service-orders.read')],
        loadComponent: () =>
          import('./officegest/pages/service-orders/service-orders').then((m) => m.ServiceOrders),
        data: { meta: privateMeta('Folhas de obra', '/gestao/folhas-de-obra') },
      },
      {
        path: 'folhas-de-obra/:serviceOrderId',
        canActivate: [permissionGuard('officegest.service-orders.read')],
        loadComponent: () =>
          import('./officegest/pages/service-orders/service-order-detail').then(
            (m) => m.ServiceOrderDetail,
          ),
        data: { meta: privateMeta('Folha de obra', '/gestao/folhas-de-obra') },
      },

      // `nova` is declared before `:appointmentId`, or the router would treat
      // it as an id and try to load a booking called "nova".
      {
        path: 'marcacoes/nova',
        canActivate: [permissionGuard('officegest.appointments.write')],
        loadComponent: () =>
          import('./officegest/pages/appointments/appointment-form').then((m) => m.AppointmentForm),
        data: { meta: privateMeta('Nova marcação', '/gestao/marcacoes/nova') },
      },
      {
        path: 'marcacoes',
        canActivate: [permissionGuard('officegest.appointments.read')],
        loadComponent: () =>
          import('./officegest/pages/appointments/appointments').then((m) => m.Appointments),
        data: { meta: privateMeta('Marcações', '/gestao/marcacoes') },
      },
      {
        path: 'marcacoes/:appointmentId',
        canActivate: [permissionGuard('officegest.appointments.read')],
        loadComponent: () =>
          import('./officegest/pages/appointments/appointment-detail').then(
            (m) => m.AppointmentDetail,
          ),
        data: { meta: privateMeta('Marcação', '/gestao/marcacoes') },
      },

      {
        path: 'trabalhadores',
        canActivate: [permissionGuard('workers.read')],
        loadComponent: () => import('./officegest/pages/workers/workers').then((m) => m.Workers),
        data: { meta: privateMeta('Trabalhadores', '/gestao/trabalhadores') },
      },

      {
        path: 'configuracoes',
        canActivate: [permissionGuard('settings.read')],
        loadComponent: () => import('./officegest/pages/settings/settings').then((m) => m.Settings),
        data: { meta: privateMeta('Configurações', '/gestao/configuracoes') },
      },

      /* Also catches an empty child path, which the front door above owns. */
      { path: '**', redirectTo: 'painel' },
    ],
  },
];
