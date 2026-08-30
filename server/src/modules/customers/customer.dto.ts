/**
 * What a caller is allowed to send to the customer endpoints.
 *
 * DTOs live beside the module rather than in a global `dto/` folder: the schema
 * and the controller that consumes it change together, and a reviewer should
 * see both without navigating away.
 */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';

/** `GET /api/officegest/customers` */
export const listCustomersQuerySchema = paginationQuerySchema.extend({
  /**
   * Bounded at both ends on purpose: a one-character term matches most of the
   * database and turns a filter into a full export, and an unbounded term is a
   * free channel into an upstream query.
   */
  search: z.string().trim().min(2).max(120).optional(),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

/**
 * `GET /api/officegest/customers/:customerId`
 *
 * The identifier is constrained rather than accepted as any string: it is
 * interpolated into an upstream path, so the safe move is to allow only the
 * characters an OfficeGest key actually uses.
 */
export const customerIdParamsSchema = z.object({
  customerId: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, 'must contain only letters, digits, dot, underscore or hyphen'),
});

export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
