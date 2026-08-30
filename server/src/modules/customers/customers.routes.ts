/**
 * Customer routes.
 *
 * A route file states the HTTP surface and nothing more: method, path, the
 * guards that run before the handler, and the handler. Reading it should answer
 * "what can be called, and what protects it" without opening another file —
 * which is exactly why no logic is allowed to accumulate here.
 */
import { Router } from 'express';

import type { CustomersService } from './customers.service.js';
import {
  CustomersController,
  getCustomerValidator,
  listCustomersValidator,
} from './customers.controller.js';

export function createCustomersRouter(service: CustomersService): Router {
  const router = Router();
  const controller = new CustomersController(service);

  router.get('/', listCustomersValidator.middleware, controller.list);
  router.get('/:customerId', getCustomerValidator.middleware, controller.getById);

  return router;
}
