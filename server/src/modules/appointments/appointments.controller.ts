/** HTTP for the appointment endpoints. */
import type { Request, RequestHandler, Response } from 'express';

import { validationFor } from '../../middleware/validation.middleware.js';
import { success } from '../../shared/http/api-response.js';
import {
  appointmentIdParamsSchema,
  createAppointmentBodySchema,
  listAppointmentsQuerySchema,
} from './appointment.dto.js';
import type { AppointmentsService } from './appointments.service.js';

export const listAppointmentsValidator = validationFor({ query: listAppointmentsQuerySchema });
export const getAppointmentValidator = validationFor({ params: appointmentIdParamsSchema });
export const createAppointmentValidator = validationFor({ body: createAppointmentBodySchema });

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

  readonly create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { body } = createAppointmentValidator.read(req);

    const appointment = await this.service.create(body, {
      logger: req.log,
      // No abort signal on a write: cancelling mid-flight would leave us unable
      // to say whether OfficeGest created the record, and the caller unable to
      // find out. The upstream timeout still bounds it.
      signal: undefined,
    });

    res
      .status(201)
      .location(`/api/officegest/appointments/${appointment.id}`)
      .json(success(appointment));
  };
}
