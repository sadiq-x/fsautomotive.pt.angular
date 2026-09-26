/** What a caller may send to the workshop-monitor endpoint. */
import { z } from 'zod';

import { isPlausiblePlate, normalisePlate } from '../vehicles/plate.js';

/** `HH:MM` on a 24-hour clock. */
const timeOfDay = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be a time of day, e.g. 08:30');

/**
 * The board query.
 *
 * Deliberately *not* `paginationQuerySchema`. The board is a wall display: it
 * shows every active job or it is not a board, and this tenant has 29 of them
 * against an upstream cap of 250. Offering `page` would invite a UI that
 * paginates a screen nobody clicks, and would let a caller request page 900 of
 * a 29-row collection. The service asks upstream for one generous page instead.
 */
export const monitorBoardQuerySchema = z.object({
  /** Restricts the board to one vehicle. Normalised so casing never matters. */
  plate: z
    .string()
    .trim()
    .transform(normalisePlate)
    .refine(isPlausiblePlate, 'must be a registration plate, e.g. AA-00-BB')
    .optional(),

  /**
   * A status code, e.g. `EXE`. Upstream already restricts this endpoint to the
   * active states, so this narrows within them rather than opening it up.
   */
  status: z
    .string()
    .trim()
    .min(1)
    .max(8)
    .regex(/^[A-Za-z]+$/, 'must be a status code, e.g. EXE')
    .transform((value) => value.toUpperCase())
    .optional(),

  /**
   * The shop's working day, used upstream to compute the completion estimate.
   *
   * Optional in full, and each part independently: upstream falls back per
   * field, so sending only `startHour` is meaningful rather than a half-applied
   * schedule.
   */
  startHour: timeOfDay.optional(),
  endHour: timeOfDay.optional(),
  lunchStart: timeOfDay.optional(),
  lunchEnd: timeOfDay.optional(),
  skipWeekends: z
    .enum(['true', 'false', '1', '0'])
    .transform((value) => value === 'true' || value === '1')
    .optional(),
});

export type MonitorBoardQuery = z.infer<typeof monitorBoardQuerySchema>;

/** A service-order number, as it appears in an OfficeGest URL or a plate search. */
export const monitorOrderParamsSchema = z.object({
  number: z.string().trim().min(1).max(32).regex(/^\d+$/, 'must be a service order number'),
});

export type MonitorOrderParams = z.infer<typeof monitorOrderParamsSchema>;
