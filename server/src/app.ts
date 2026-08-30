/**
 * Builds the Express application.
 *
 * WHY THIS IS SEPARATE FROM `server.ts`
 * -------------------------------------
 * Nothing here binds a port, reads a signal or touches the process. That is
 * what lets a test import the whole application — every middleware, every
 * route, the real error handling — and drive it with `supertest` without a
 * listening socket, and it is what would let the same app run behind a
 * serverless adapter without change.
 *
 * MIDDLEWARE ORDER IS THE CONTRACT
 * --------------------------------
 * It is not stylistic. Each step below depends on the ones above it:
 *
 *  1. `helmet`        — response headers, set before anything can answer.
 *  2. `requestContext`— every later log line and error needs `req.id`.
 *  3. `requestLogger` — must wrap the handlers to time them.
 *  4. `cors`          — a rejected pre-flight should not reach a body parser.
 *  5. `express.json`  — bounded, and only after the request is allowed.
 *  6. `rateLimit`     — cheap refusal before any upstream work.
 *  7. routes
 *  8. `notFound`      — only after every route had its chance.
 *  9. `errorHandler`  — last, so it sees everything the others throw.
 */
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { config } from './config/index.js';
import type { Container } from './container.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/not-found.middleware.js';
import { rateLimit } from './middleware/rate-limit.middleware.js';
import { requestContext } from './middleware/request-context.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import { createApiRouter } from './routes/index.js';

/** A JSON body larger than this is a mistake or an attack; either way, refuse it. */
const MAX_BODY_SIZE = '64kb';

export function createApp(container: Container): Express {
  const app = express();

  // Behind a reverse proxy or a platform load balancer, the client address the
  // rate limiter keys on is in `X-Forwarded-For`. `1` trusts exactly one hop —
  // `true` would let any caller spoof the header and evade the limit.
  app.set('trust proxy', 1);
  // The framework advertising itself buys an attacker a version number.
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(requestContext());
  app.use(requestLogger());

  app.use(
    cors({
      // An empty allow-list means "no browser origin is allowed" rather than
      // "all are": this service holds a credential to the client's ERP, and the
      // permissive default is the wrong one to inherit by omission.
      origin: config.cors.allowedOrigins.length > 0 ? [...config.cors.allowedOrigins] : false,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'x-api-key', 'x-request-id'],
      exposedHeaders: ['x-request-id', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: MAX_BODY_SIZE }));
  app.use(rateLimit());

  app.use(createApiRouter(container));

  app.use(notFound());
  app.use(errorHandler());

  return app;
}
