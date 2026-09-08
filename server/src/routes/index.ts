/**
 * The API surface, in one file.
 *
 * Mounting every module here — rather than letting each register itself against
 * a shared app — means the URL layout of the service is readable in thirty
 * lines, and, more importantly, that the guard on each resource is written
 * beside the route it guards. Authorisation that is spread across five module
 * files is authorisation nobody can review in one sitting.
 *
 * THE PERMISSIONS BELOW ARE THE SECURITY BOUNDARY
 * -----------------------------------------------
 * The Angular application has route guards with the same names. Those decide
 * which screen to show; these decide which data leaves the building. A visitor
 * who edits the bundle to reach `/private/settings` gets the page and an empty
 * one, because every request it makes is refused here.
 */
import { Router } from 'express';

import { config } from '../config/index.js';
import type { Container } from '../container.js';
import {
  enforceOrigin,
  identify,
  requireAccess,
  requirePermission,
} from '../middleware/access.middleware.js';
import { createAppointmentsRouter } from '../modules/appointments/appointments.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createCustomersRouter } from '../modules/customers/customers.routes.js';
import { createEmployeesRouter } from '../modules/employees/employees.routes.js';
import { createServiceOrdersRouter } from '../modules/service-orders/service-orders.routes.js';
import { createVehiclesRouter } from '../modules/vehicles/vehicles.routes.js';
import { createHealthRouter } from './health.routes.js';

/** Everything OfficeGest-backed lives under this prefix. */
export const OFFICEGEST_ROUTE_PREFIX = '/api/officegest';

/** Sign-in for the private area of the site. */
export const AUTH_ROUTE_PREFIX = '/api/auth';

export function createApiRouter(container: Container): Router {
  const router = Router();

  // Unauthenticated on purpose: a platform health probe cannot present a key,
  // and it is mounted before `identify` because it has no use for one.
  router.use('/health', createHealthRouter());

  // Establishes who is calling for everything below. It refuses nothing —
  // `/api/auth/session` and `/api/auth/login` are reachable without a
  // credential by definition, and the guards further down do the refusing.
  router.use(identify(container.auth));
  router.use(enforceOrigin());

  if (container.auth.enabled) {
    // Not mounted at all when no accounts are configured. A sign-in endpoint
    // that can only ever answer 401 is worse than a 404: it invites attempts,
    // costs a scrypt derivation each time, and tells anyone scanning that this
    // service has accounts somewhere.
    router.use(AUTH_ROUTE_PREFIX, createAuthRouter(container.auth, config.auth.cookie));
  }

  const officegest = Router();

  // Applied to the namespace rather than to each route, so an endpoint added
  // later is protected by default instead of by remembering.
  officegest.use(requireAccess());

  officegest.use(
    '/customers',
    requirePermission('officegest.customers.read'),
    createCustomersRouter(container.customers),
  );
  officegest.use(
    '/vehicles',
    requirePermission('officegest.vehicles.read'),
    createVehiclesRouter(container.vehicles),
  );
  officegest.use(
    '/service-orders',
    requirePermission('officegest.service-orders.read'),
    createServiceOrdersRouter(container.serviceOrders),
  );

  // Staff are not OfficeGest business data in the way the resources above are,
  // and the site's own "Trabalhadores" page is what reads them — so the grant
  // is the one that page requires, deliberately outside the `officegest.*`
  // umbrella that `officegest.read` opens.
  officegest.use(
    '/employees',
    requirePermission('workers.read'),
    createEmployeesRouter(container.employees),
  );

  officegest.use(
    '/appointments',
    requirePermission('officegest.appointments.read'),
    createAppointmentsRouter(container.appointments),
  );

  router.use(OFFICEGEST_ROUTE_PREFIX, officegest);

  return router;
}
