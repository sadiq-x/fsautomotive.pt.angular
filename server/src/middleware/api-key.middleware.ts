/**
 * Guards *this* service's endpoints with an `x-api-key` header.
 *
 * WHY THIS IS SEPARATE FROM THE OFFICEGEST CREDENTIAL
 * ---------------------------------------------------
 * The whole point of the backend is that the OfficeGest credential never leaves
 * it. A key configured here can be held by the front end, rotated on its own
 * schedule, and revoked without touching OfficeGest — and if it leaks, the
 * blast radius is this API's read endpoints, not the client's ERP. Sharing one
 * secret for both would throw that away.
 *
 * The guard is optional: with `BACKEND_API_KEYS` unset it does nothing, which
 * suits a service reachable only from inside a private network. When it *is*
 * set, a request without a valid key never reaches a controller.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { config } from '../config/index.js';
import { UnauthorizedError } from '../shared/errors/index.js';

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

function matchesAny(candidate: string, allowed: readonly Buffer[]): boolean {
  const candidateDigest = digest(candidate);
  let matched = false;

  // Every entry is compared — no early exit — so the number of comparisons does
  // not reveal the position of the matching key.
  for (const entry of allowed) {
    if (timingSafeEqual(candidateDigest, entry)) {
      matched = true;
    }
  }

  return matched;
}

export function requireApiKey(): RequestHandler {
  const allowed = config.apiKeys.map(digest);

  if (allowed.length === 0) {
    return (_req: Request, _res: Response, next: NextFunction): void => next();
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const provided = req.headers[API_KEY_HEADER];

    if (typeof provided !== 'string' || !matchesAny(provided, allowed)) {
      // The log records the failure, never the key that was offered.
      req.log.warn('rejected request with a missing or invalid API key', {
        path: req.path,
        hasHeader: typeof provided === 'string',
      });
      next(new UnauthorizedError('A valid x-api-key header is required.'));
      return;
    }

    next();
  };
}
