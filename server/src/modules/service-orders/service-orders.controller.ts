/** HTTP for the service-order endpoints. */
import type { Request, RequestHandler, Response } from 'express';

import { validationFor } from '../../middleware/validation.middleware.js';
import { success } from '../../shared/http/api-response.js';
import { listServiceOrdersQuerySchema, serviceOrderIdParamsSchema } from './service-order.dto.js';
import type { ServiceOrdersService } from './service-orders.service.js';

export const listServiceOrdersValidator = validationFor({ query: listServiceOrdersQuerySchema });
export const getServiceOrderValidator = validationFor({ params: serviceOrderIdParamsSchema });

export class ServiceOrdersController {
  constructor(private readonly service: ServiceOrdersService) {}

  readonly list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { query } = listServiceOrdersValidator.read(req);

    const result = await this.service.list(query, { logger: req.log, signal: req.abortSignal });

    res.status(200).json(success(result.serviceOrders, result.meta));
  };

  readonly getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { params } = getServiceOrderValidator.read(req);

    const serviceOrder = await this.service.getById(params.serviceOrderId, {
      logger: req.log,
      signal: req.abortSignal,
    });

    res.status(200).json(success(serviceOrder));
  };
}
