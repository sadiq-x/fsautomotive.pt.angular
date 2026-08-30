/** What a caller may send to the service-order endpoints. */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { isPlausiblePlate, normalisePlate } from '../vehicles/plate.js';

export const listServiceOrdersQuerySchema = paginationQuerySchema.extend({
  /** Restricts the list to one vehicle. Normalised so casing never matters. */
  plate: z
    .string()
    .trim()
    .transform(normalisePlate)
    .refine(isPlausiblePlate, 'must be a registration plate, e.g. AA-00-BB')
    .optional(),
  status: z.string().trim().min(1).max(40).optional(),
});

export type ListServiceOrdersQuery = z.infer<typeof listServiceOrdersQuerySchema>;

export const serviceOrderIdParamsSchema = z.object({
  serviceOrderId: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(
      /^[A-Za-z0-9._/-]+$/,
      'must contain only letters, digits, dot, slash, underscore or hyphen',
    ),
});

export type ServiceOrderIdParams = z.infer<typeof serviceOrderIdParamsSchema>;
