/** Vehicle routes. */
import { Router } from 'express';

import {
  VehiclesController,
  getVehicleValidator,
  listVehiclesValidator,
} from './vehicles.controller.js';
import type { VehiclesService } from './vehicles.service.js';

export function createVehiclesRouter(service: VehiclesService): Router {
  const router = Router();
  const controller = new VehiclesController(service);

  router.get('/', listVehiclesValidator.middleware, controller.list);
  router.get('/:plate', getVehicleValidator.middleware, controller.getByPlate);

  return router;
}
