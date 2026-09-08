/**
 * What `POST /api/auth/login` accepts.
 *
 * The bounds are not cosmetic. Every candidate password is put through scrypt,
 * which is deliberately expensive — so an unbounded field turns one request
 * into minutes of CPU, and a handful of them into an outage. The body-size
 * limit in `app.ts` does not help: 64 KB of password is 64 KB of scrypt input.
 *
 * `.strict()` rejects unknown fields rather than ignoring them, so a client
 * sending `{ email, password, role: 'ADMIN' }` is told it is wrong instead of
 * being quietly served a session with the role it asked for. Nothing here reads
 * such a field today; the point is that nothing added later can.
 */
import { z } from 'zod';

/** RFC 5321's maximum reversible path length. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Long enough for any passphrase a person or a password manager produces, short
 * enough that hashing it is bounded work.
 */
const MAX_PASSWORD_LENGTH = 256;

export const loginBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(3, 'is required')
      .max(MAX_EMAIL_LENGTH, `must be at most ${MAX_EMAIL_LENGTH} characters`),
    // Not trimmed: a leading or trailing space is part of a password, and
    // silently removing it makes a correct password fail with no explanation.
    password: z
      .string()
      .min(1, 'is required')
      .max(MAX_PASSWORD_LENGTH, `must be at most ${MAX_PASSWORD_LENGTH} characters`),
  })
  .strict();

export type LoginBody = z.infer<typeof loginBodySchema>;
