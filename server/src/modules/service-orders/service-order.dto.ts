/** What a caller may send to the service-order endpoints. */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { isPlausiblePlate, normalisePlate } from '../vehicles/plate.js';

/** An ISO-8601 instant. Kept as a string; only its parseability is asserted. */
const isoDateTime = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be an ISO-8601 date-time')
  .transform((value) => new Date(value).toISOString());

/**
 * Free-text search.
 *
 * Applied by this service rather than upstream, which has no search parameter.
 * Trimming to `undefined` keeps "no search" and "search for nothing" from being
 * two states that mean the same thing.
 */
const search = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value === '' ? undefined : value))
  .optional();

export const listServiceOrdersQuerySchema = paginationQuerySchema.extend({
  /** ISO-8601 instants; only the date part reaches upstream. */
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  search,
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
