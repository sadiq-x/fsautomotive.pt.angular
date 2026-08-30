/** HTTP for the vehicle endpoints. */
import type { Request, RequestHandler, Response } from 'express';

import { validationFor } from '../../middleware/validation.middleware.js';
import { success } from '../../shared/http/api-response.js';
import { listVehiclesQuerySchema, vehiclePlateParamsSchema } from './vehicle.dto.js';
import type { VehiclesService } from './vehicles.service.js';

export const listVehiclesValidator = validationFor({ query: listVehiclesQuerySchema });
export const getVehicleValidator = validationFor({ params: vehiclePlateParamsSchema });

export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  readonly list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { query } = listVehiclesValidator.read(req);

    const result = await this.service.list(query, { logger: req.log, signal: req.abortSignal });

    res.status(200).json(success(result.vehicles, result.meta));
  };

  readonly getByPlate: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { params } = getVehicleValidator.read(req);

    const vehicle = await this.service.getByPlate(params.plate, {
      logger: req.log,
      signal: req.abortSignal,
    });

    res.status(200).json(success(vehicle));
  };
}
