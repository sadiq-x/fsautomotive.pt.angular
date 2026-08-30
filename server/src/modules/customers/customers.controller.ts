/**
 * HTTP for the customer endpoints — and nothing else.
 *
 * A controller's whole job is translation: validated input in, service call,
 * envelope out. It contains no OfficeGest knowledge (no paths, no headers, no
 * retry rules) and no business rules, so the same use case can be driven from a
 * queue worker tomorrow without dragging Express along.
 *
 * There is no try/catch. Express 5 forwards a rejected promise from a handler
 * to the error middleware, which is the only place that decides what an error
 * looks like on the wire. Catching here would mean re-deciding that, per route.
 */
import type { Request, RequestHandler, Response } from 'express';

import { success } from '../../shared/http/api-response.js';
import { customerIdParamsSchema, listCustomersQuerySchema } from './customer.dto.js';
import { validationFor } from '../../middleware/validation.middleware.js';
import type { CustomersService } from './customers.service.js';

export const listCustomersValidator = validationFor({ query: listCustomersQuerySchema });
export const getCustomerValidator = validationFor({ params: customerIdParamsSchema });

export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  readonly list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { query } = listCustomersValidator.read(req);

    const result = await this.service.list(query, {
      logger: req.log,
      // Opened by `requestContext`: a browser that navigates away cancels the
      // upstream call instead of spending OfficeGest quota on a response nobody
      // will read.
      signal: req.abortSignal,
    });

    res.status(200).json(success(result.customers, result.meta));
  };

  readonly getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { params } = getCustomerValidator.read(req);

    const customer = await this.service.getById(params.customerId, {
      logger: req.log,
      signal: req.abortSignal,
    });

    res.status(200).json(success(customer));
  };
}
