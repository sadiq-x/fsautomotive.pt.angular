/** Appointment routes. */
import { Router } from 'express';

import {
  AppointmentsController,
  createAppointmentValidator,
  getAppointmentValidator,
  listAppointmentsValidator,
} from './appointments.controller.js';
import type { AppointmentsService } from './appointments.service.js';

export function createAppointmentsRouter(service: AppointmentsService): Router {
  const router = Router();
  const controller = new AppointmentsController(service);

  router.get('/', listAppointmentsValidator.middleware, controller.list);
  router.post('/', createAppointmentValidator.middleware, controller.create);
  router.get('/:appointmentId', getAppointmentValidator.middleware, controller.getById);

  return router;
}
