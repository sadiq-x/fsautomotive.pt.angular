/**
 * The API surface, in one file.
 *
 * Mounting every module here — rather than letting each register itself against
 * a shared app — means the URL layout of the service is readable in twenty
 * lines, and the guards that apply to the whole OfficeGest namespace are stated
 * once instead of repeated per module.
 */
import { Router } from 'express';

import type { Container } from '../container.js';
import { requireApiKey } from '../middleware/api-key.middleware.js';
import { createAppointmentsRouter } from '../modules/appointments/appointments.routes.js';
import { createCustomersRouter } from '../modules/customers/customers.routes.js';
import { createServiceOrdersRouter } from '../modules/service-orders/service-orders.routes.js';
import { createVehiclesRouter } from '../modules/vehicles/vehicles.routes.js';
import { createHealthRouter } from './health.routes.js';

/** Everything OfficeGest-backed lives under this prefix. */
export const OFFICEGEST_ROUTE_PREFIX = '/api/officegest';

export function createApiRouter(container: Container): Router {
  const router = Router();

  // Unauthenticated on purpose: a platform health probe cannot present a key.
  router.use('/health', createHealthRouter());

  const officegest = Router();

  // Applied to the namespace rather than to each route, so an endpoint added
  // later is protected by default instead of by remembering.
  officegest.use(requireApiKey());

  officegest.use('/customers', createCustomersRouter(container.customers));
  officegest.use('/vehicles', createVehiclesRouter(container.vehicles));
  officegest.use('/service-orders', createServiceOrdersRouter(container.serviceOrders));
  officegest.use('/appointments', createAppointmentsRouter(container.appointments));

  router.use(OFFICEGEST_ROUTE_PREFIX, officegest);

  return router;
}
