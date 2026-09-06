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
   * `/private` is not a page — it is the name of the area, so it hands over to
   * the front door.
   *
   * `pathMatch: 'full'` keeps this to `/private` exactly and leaves
   * `/private/<anything>` to the routes below. It is safe as a *static*
   * redirect only because its target resolves in both directions (see below);
   * pointing it straight at `dashboard` would bounce an anonymous visitor into
   * a protected route just to have them turned away again.
   */
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  /**
   * `/private/login` is the front door, and the only place a refused request
   * lands.
   *
   * `guestGuard` decides what it shows: the sign-in form for an anonymous
   * visitor, or a redirect to the dashboard for someone already signed in.
   * Because the guard resolves it both ways, every guard, the 401 handler and
   * sign-out can point at this one URL without risking a redirect loop.
   */
  {
    path: 'login',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
    data: { meta: privateMeta('Entrar', '/private/login') },
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/private-shell').then((m) => m.PrivateShell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./officegest/pages/dashboard/dashboard').then((m) => m.Dashboard),
        data: { meta: privateMeta('Painel', '/private/dashboard') },
      },

      {
        path: 'customers',
        canActivate: [permissionGuard('officegest.customers.read')],
        loadComponent: () =>
          import('./officegest/pages/customers/customers').then((m) => m.Customers),
        data: { meta: privateMeta('Clientes', '/private/customers') },
      },
      {
        path: 'customers/:customerId',
        canActivate: [permissionGuard('officegest.customers.read')],
        loadComponent: () =>
          import('./officegest/pages/customers/customer-detail').then((m) => m.CustomerDetail),
        data: { meta: privateMeta('Cliente', '/private/customers') },
      },

      {
        path: 'vehicles',
        canActivate: [permissionGuard('officegest.vehicles.read')],
        loadComponent: () => import('./officegest/pages/vehicles/vehicles').then((m) => m.Vehicles),
        data: { meta: privateMeta('Veículos', '/private/vehicles') },
      },
      {
        path: 'vehicles/:plate',
        canActivate: [permissionGuard('officegest.vehicles.read')],
        loadComponent: () =>
          import('./officegest/pages/vehicles/vehicle-detail').then((m) => m.VehicleDetail),
        data: { meta: privateMeta('Veículo', '/private/vehicles') },
      },

      {
        path: 'service-orders',
        canActivate: [permissionGuard('officegest.service-orders.read')],
        loadComponent: () =>
          import('./officegest/pages/service-orders/service-orders').then((m) => m.ServiceOrders),
        data: { meta: privateMeta('Folhas de obra', '/private/service-orders') },
      },
      {
        path: 'service-orders/:serviceOrderId',
        canActivate: [permissionGuard('officegest.service-orders.read')],
        loadComponent: () =>
          import('./officegest/pages/service-orders/service-order-detail').then(
            (m) => m.ServiceOrderDetail,
          ),
        data: { meta: privateMeta('Folha de obra', '/private/service-orders') },
      },

      // `new` is declared before `:appointmentId`, or the router would treat
      // it as an id and try to load a booking called "new".
      {
        path: 'appointments/new',
        canActivate: [permissionGuard('officegest.appointments.write')],
        loadComponent: () =>
          import('./officegest/pages/appointments/appointment-form').then((m) => m.AppointmentForm),
        data: { meta: privateMeta('Nova marcação', '/private/appointments/new') },
      },
      {
        path: 'appointments',
        canActivate: [permissionGuard('officegest.appointments.read')],
        loadComponent: () =>
          import('./officegest/pages/appointments/appointments').then((m) => m.Appointments),
        data: { meta: privateMeta('Marcações', '/private/appointments') },
      },
      {
        path: 'appointments/:appointmentId',
        canActivate: [permissionGuard('officegest.appointments.read')],
        loadComponent: () =>
          import('./officegest/pages/appointments/appointment-detail').then(
            (m) => m.AppointmentDetail,
          ),
        data: { meta: privateMeta('Marcação', '/private/appointments') },
      },

      {
        path: 'workers',
        canActivate: [permissionGuard('workers.read')],
        loadComponent: () => import('./officegest/pages/workers/workers').then((m) => m.Workers),
        data: { meta: privateMeta('Trabalhadores', '/private/workers') },
      },

      {
        path: 'settings',
        canActivate: [permissionGuard('settings.read')],
        loadComponent: () => import('./officegest/pages/settings/settings').then((m) => m.Settings),
        data: { meta: privateMeta('Configurações', '/private/settings') },
      },

      /* Also catches an empty child path, which the redirect above owns. */
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
