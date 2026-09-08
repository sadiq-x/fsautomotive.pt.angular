/** HTTP for the appointment endpoints. */
import type { Request, RequestHandler, Response } from 'express';

import { validationFor } from '../../middleware/validation.middleware.js';
import { success } from '../../shared/http/api-response.js';
import { appointmentIdParamsSchema, listAppointmentsQuerySchema } from './appointment.dto.js';
import type { AppointmentsService } from './appointments.service.js';

export const listAppointmentsValidator = validationFor({ query: listAppointmentsQuerySchema });
export const getAppointmentValidator = validationFor({ params: appointmentIdParamsSchema });

export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  readonly list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { query } = listAppointmentsValidator.read(req);

    const result = await this.service.list(query, { logger: req.log, signal: req.abortSignal });

    res.status(200).json(success(result.appointments, result.meta));
  };

  readonly getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { params } = getAppointmentValidator.read(req);

    const appointment = await this.service.getById(params.appointmentId, {
      logger: req.log,
      signal: req.abortSignal,
    });

    res.status(200).json(success(appointment));
  };
}
