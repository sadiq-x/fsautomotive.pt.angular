/**
 * The OfficeGest wire types and the schemas that police them.
 *
 * WHY VALIDATE A RESPONSE WE ASKED FOR
 * ------------------------------------
 * An upstream response is untrusted input in exactly the way a browser request
 * is. If OfficeGest renames a field, the choice is between a `TypeError` deep
 * inside a mapper — reported as a 500 with a stack trace that says nothing —
 * and one explicit `OFFICEGEST_MALFORMED_RESPONSE` naming the field. The second
 * is the difference between a five-minute diagnosis and an afternoon.
 *
 * The envelope is validated strictly, because it is documented. Individual
 * records are validated permissively (every field optional, unknown fields
 * tolerated), because their field names are *not* documented — see
 * `officegest.constants.ts`. That combination fails loudly on the part we know
 * and stays working on the part we do not.
 */
import { z } from 'zod';

/** A single upstream record before mapping. Keys are unknown until observed. */
export const officeGestRecordSchema = z.looseObject({});

export type OfficeGestRecord = z.infer<typeof officeGestRecordSchema>;

/**
 * `meta` as documented: `{ current_page, total }`. Both optional because not
 * every endpoint paginates, and unknown keys are tolerated so an added field
 * upstream is not an outage here.
 */
export const officeGestMetaSchema = z.looseObject({
  current_page: z.coerce.number().int().optional(),
  per_page: z.coerce.number().int().optional(),
  total: z.coerce.number().int().optional(),
  last_page: z.coerce.number().int().optional(),
});

export type OfficeGestMeta = z.infer<typeof officeGestMetaSchema>;

/** `{ data: [...], meta: {...} }` — the documented list envelope. */
export function officeGestListEnvelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: officeGestMetaSchema.optional(),
  });
}

/** `{ data: {...} }` — the documented single-resource envelope. */
export function officeGestItemEnvelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: item,
    meta: officeGestMetaSchema.optional(),
  });
}

/**
 * The login response. The token field name is read via `AUTH_TOKEN_FIELDS`
 * rather than pinned here, because the documentation and the deployed API
 * disagree about it.
 */
export const officeGestLoginResponseSchema = z.object({
  data: z.looseObject({
    access_token: z.string().min(1).optional(),
    token: z.string().min(1).optional(),
    expires_in: z.coerce.number().int().positive().optional(),
  }),
});

export type OfficeGestLoginResponse = z.infer<typeof officeGestLoginResponseSchema>;

/**
 * An OfficeGest error body. Shapes vary by module, so every field is optional
 * and this is only ever used to enrich a log line or a 422's `details`.
 */
export const officeGestErrorBodySchema = z.looseObject({
  message: z.string().optional(),
  error: z.union([z.string(), z.looseObject({})]).optional(),
  errors: z.unknown().optional(),
});

/** A list result after validation, before mapping to a domain model. */
export interface OfficeGestListResult<T> {
  readonly items: readonly T[];
  readonly meta: OfficeGestMeta | undefined;
}
