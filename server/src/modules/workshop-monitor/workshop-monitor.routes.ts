/** Workshop-board routes. */
import { Router } from 'express';

import {
  WorkshopMonitorController,
  monitorBoardValidator,
  monitorOrderValidator,
} from './workshop-monitor.controller.js';
import type { WorkshopMonitorService } from './workshop-monitor.service.js';

export function createWorkshopMonitorRouter(service: WorkshopMonitorService): Router {
  const router = Router();
  const controller = new WorkshopMonitorController(service);

  router.get('/', monitorBoardValidator.middleware, controller.board);
  router.get('/:number', monitorOrderValidator.middleware, controller.order);

  return router;
}
