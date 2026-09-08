/** What a caller may send to the appointment endpoints. */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { APPOINTMENT_STATUSES } from './appointment.model.js';

/** An ISO-8601 instant. Kept as a string; only its parseability is asserted. */
const isoDateTime = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be an ISO-8601 date-time')
  .transform((value) => new Date(value).toISOString());

/**
 * Free-text search.
 *
 * Bounded and trimmed, and an empty result of trimming becomes `undefined`
 * rather than `''` — otherwise "no search" and "search for nothing" would be
 * two states meaning the same thing, and only one of them would count as an
 * active filter.
 */
const search = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value === '' ? undefined : value))
  .optional();

export const listAppointmentsQuerySchema = paginationQuerySchema.extend({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  customerId: z.string().trim().min(1).max(64).optional(),
  /**
   * `none` is a real choice, not the absence of one: it selects the bookings
   * with no state set, which are a third of this tenant's diary. Omitting the
   * parameter is what means "any state".
   */
  status: z.enum([...APPOINTMENT_STATUSES, 'none']).optional(),
  search,
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

export const appointmentIdParamsSchema = z.object({
  appointmentId: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, 'is not a valid id'),
});

export type AppointmentIdParams = z.infer<typeof appointmentIdParamsSchema>;
