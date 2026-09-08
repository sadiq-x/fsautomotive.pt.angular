/**
 * The three endpoints the Angular application's `auth.contract.ts` describes.
 *
 * WHY LOGIN HAS ITS OWN RATE LIMIT
 * --------------------------------
 * `AuthService` throttles per account and per client address, which is what
 * stops guessing. This limiter is a different control for a different problem:
 * it bounds the *cost* of the requests themselves. Each attempt spends ~100 ms
 * of CPU on scrypt whether or not the account exists, so a flood of them is a
 * denial of service that never trips an account-level counter — the attacker
 * need not aim at any particular account.
 */
import { Router } from 'express';

import type { AuthCookieConfig } from '../../config/auth.config.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { AuthController, loginValidator } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

/**
 * Sign-in attempts per address per minute, before the request is refused
 * outright. Comfortably above a person mistyping a password, far below what it
 * takes to make the hashing cost hurt.
 */
const LOGIN_RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 } as const;

export function createAuthRouter(service: AuthService, cookie: AuthCookieConfig): Router {
  const router = Router();
  const controller = new AuthController(service, cookie);

  // A limiter of its own, with its own counters: it must not share a budget
  // with ordinary browsing, or a busy dashboard would spend the sign-in
  // allowance and lock the workshop out of its own login page.
  router.post('/login', rateLimit(LOGIN_RATE_LIMIT), loginValidator.middleware, controller.login);

  // Deliberately unguarded: "am I signed in?" is the question, and answering it
  // with a 401 is a valid answer rather than a failure. The browser asks it on
  // every hard refresh, before it can know.
  router.get('/session', controller.session);

  router.post('/logout', controller.logout);

  return router;
}
