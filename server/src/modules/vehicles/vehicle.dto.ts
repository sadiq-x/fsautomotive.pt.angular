/** What a caller may send to the vehicle endpoints. */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { isPlausiblePlate, normalisePlate } from './plate.js';

export const listVehiclesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(2).max(120).optional(),
});

export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;

/**
 * `GET /api/officegest/vehicles/:plate`
 *
 * Normalising inside the schema means every downstream consumer — service,
 * upstream path, response — sees the same canonical form, and it is impossible
 * to forget the step at one call site.
 */
export const vehiclePlateParamsSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1)
    .max(16)
    .transform(normalisePlate)
    .refine(isPlausiblePlate, 'must be a registration plate, e.g. AA-00-BB'),
});

export type VehiclePlateParams = z.infer<typeof vehiclePlateParamsSchema>;
