/** Service-order routes. */
import { Router } from 'express';

import {
  ServiceOrdersController,
  getServiceOrderValidator,
  listServiceOrdersValidator,
} from './service-orders.controller.js';
import type { ServiceOrdersService } from './service-orders.service.js';

export function createServiceOrdersRouter(service: ServiceOrdersService): Router {
  const router = Router();
  const controller = new ServiceOrdersController(service);

  router.get('/', listServiceOrdersValidator.middleware, controller.list);
  router.get('/:serviceOrderId', getServiceOrderValidator.middleware, controller.getById);

  return router;
}
