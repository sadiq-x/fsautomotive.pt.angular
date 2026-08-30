/**
 * A fixed-window request limiter, in memory.
 *
 * WHY IT IS HERE AT ALL
 * ---------------------
 * This service holds a credential to the client's ERP and OfficeGest applies
 * its own quota to it. Without a limit at our edge, one careless loop in a
 * browser tab spends that quota and every other consumer of the integration
 * starts failing. Refusing cheaply here protects the upstream budget.
 *
 * LIMITS OF THIS IMPLEMENTATION
 * -----------------------------
 * The counters live in this process, so with N instances the effective limit is
 * N × `maxRequests`. That is an accepted trade for a single-instance
 * deployment; behind a load balancer, move the counter to a shared store. It is
 * a guard rail against accidents, not a defence against a determined attacker —
 * that belongs at the CDN or reverse proxy.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { config } from '../config/index.js';
import { RateLimitedError } from '../shared/errors/index.js';

interface Window {
  count: number;
  /** Epoch ms at which the window resets. */
  resetAt: number;
}

export interface RateLimitOptions {
  readonly windowMs?: number;
  readonly maxRequests?: number;
  /** Overridable so tests do not depend on socket addresses. */
  readonly keyOf?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
  const windowMs = options.windowMs ?? config.rateLimit.windowMs;
  const maxRequests = options.maxRequests ?? config.rateLimit.maxRequests;
  const keyOf = options.keyOf ?? ((req: Request) => req.ip ?? 'unknown');
  const windows = new Map<string, Window>();

  // Expired entries would otherwise accumulate one per client address for the
  // lifetime of the process. `unref` keeps the timer from holding Node open.
  const sweeper = setInterval(() => {
    const now = Date.now();

    for (const [key, window] of windows) {
      if (window.resetAt <= now) {
        windows.delete(key);
      }
    }
  }, windowMs);

  sweeper.unref?.();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = keyOf(req);
    const existing = windows.get(key);
    const window =
      existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

    window.count += 1;
    windows.set(key, window);

    const remaining = Math.max(0, maxRequests - window.count);
    const resetSeconds = Math.ceil((window.resetAt - now) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (window.count > maxRequests) {
      next(new RateLimitedError('Too many requests. Please slow down.', resetSeconds));
      return;
    }

    next();
  };
}
