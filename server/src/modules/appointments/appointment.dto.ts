/** What a caller may send to the appointment endpoints. */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { isPlausiblePlate, normalisePlate } from '../vehicles/plate.js';

/** An ISO-8601 instant. Kept as a string; only its parseability is asserted. */
const isoDateTime = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be an ISO-8601 date-time')
  .transform((value) => new Date(value).toISOString());

const plate = z
  .string()
  .trim()
  .transform(normalisePlate)
  .refine(isPlausiblePlate, 'must be a registration plate, e.g. AA-00-BB');

export const listAppointmentsQuerySchema = paginationQuerySchema.extend({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  customerId: z.string().trim().min(1).max(64).optional(),
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

/**
 * `POST /api/officegest/appointments`
 *
 * Ordering (`endsAt` after `startsAt`) is asserted here because it is a property
 * of the payload itself. Whether the slot is in the future is *not* — that is a
 * rule about the world, it depends on the clock, and it belongs in the service
 * where it can be tested with a fixed time.
 */
export const createAppointmentBodySchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    startsAt: isoDateTime,
    endsAt: isoDateTime.optional(),
    customerId: z.string().trim().min(1).max(64).optional(),
    plate: plate.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (value) => value.endsAt === undefined || Date.parse(value.endsAt) > Date.parse(value.startsAt),
    { path: ['endsAt'], message: 'must be after startsAt' },
  );

export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;
