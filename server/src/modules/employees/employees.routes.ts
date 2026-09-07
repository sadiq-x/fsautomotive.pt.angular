/** Staff routes. */
import { Router } from 'express';

import { EmployeesController, listEmployeesValidator } from './employees.controller.js';
import type { EmployeesService } from './employees.service.js';

export function createEmployeesRouter(service: EmployeesService): Router {
  const router = Router();
  const controller = new EmployeesController(service);

  router.get('/', listEmployeesValidator.middleware, controller.list);

  return router;
}
