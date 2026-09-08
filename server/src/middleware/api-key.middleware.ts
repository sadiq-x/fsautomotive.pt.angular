/**
 * The `x-api-key` half of this service's access control.
 *
 * WHY THIS IS SEPARATE FROM THE OFFICEGEST CREDENTIAL
 * ---------------------------------------------------
 * The whole point of the backend is that the OfficeGest credential never leaves
 * it. A key configured here can be held by another service, rotated on its own
 * schedule, and revoked without touching OfficeGest — and if it leaks, the blast
 * radius is this API's read endpoints, not the client's ERP. Sharing one secret
 * for both would throw that away.
 *
 * WHY IT IS A VERIFIER AND NOT A GUARD
 * ------------------------------------
 * A key is one of two ways to be allowed in; a signed-in user with a session
 * cookie is the other, and the browser can only ever use the second — anything
 * compiled into the bundle is public, so the front end cannot hold a key at all.
 * Making this a predicate lets `access.middleware.ts` state that choice once,
 * rather than having two guards race to reject the request the other would have
 * accepted.
 *
 * The key is optional: with `BACKEND_API_KEYS` unset there is nothing to
 * present, which suits a deployment where the only caller is the browser.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

import { config } from '../config/index.js';

const API_KEY_HEADER = 'x-api-key';

/**
 * Compares digests rather than the keys themselves.
 *
 * Hashing first makes every comparison the same length, so `timingSafeEqual`
 * cannot throw on a length mismatch and the length of the real key is not
 * observable through timing.
 */
function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export interface ApiKeyVerifier {
  /** `false` when `BACKEND_API_KEYS` is unset — there is then no key to offer. */
  readonly configured: boolean;
  /** Whether this request carries one of the configured keys. */
  matches(req: Request): boolean;
}

export function createApiKeyVerifier(keys: readonly string[] = config.apiKeys): ApiKeyVerifier {
  const allowed = keys.map(digest);

  return {
    configured: allowed.length > 0,

    matches(req: Request): boolean {
      const provided = req.headers[API_KEY_HEADER];

      if (allowed.length === 0 || typeof provided !== 'string') {
        return false;
      }

      const candidate = digest(provided);
      let matched = false;

      // Every entry is compared — no early exit — so the number of comparisons
      // does not reveal the position of the matching key.
      for (const entry of allowed) {
        if (timingSafeEqual(candidate, entry)) {
          matched = true;
        }
      }

      return matched;
    },
  };
}
