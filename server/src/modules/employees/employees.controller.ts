/** HTTP for the staff endpoint. Translation only — see `customers.controller.ts`. */
import type { Request, RequestHandler, Response } from 'express';

import { success } from '../../shared/http/api-response.js';
import { validationFor } from '../../middleware/validation.middleware.js';
import { listEmployeesQuerySchema } from './employee.dto.js';
import type { EmployeesService } from './employees.service.js';

export const listEmployeesValidator = validationFor({ query: listEmployeesQuerySchema });

export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  readonly list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { query } = listEmployeesValidator.read(req);

    const result = await this.service.list(query, { logger: req.log, signal: req.abortSignal });

    res.status(200).json(success(result.employees, result.meta));
  };
}
