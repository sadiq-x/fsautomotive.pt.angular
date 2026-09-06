/**
 * One log line per finished request.
 *
 * Logged on `finish` rather than on arrival, because the useful facts — status
 * and duration — only exist at the end. Requests that are never answered still
 * appear, via `close`, which is what makes a client that hangs up mid-upstream
 * call visible instead of silent.
 *
 * The URL is logged as the full request path plus the *names* of the query
 * parameters, never their values: a search term can contain a customer's name
 * or plate, and that does not belong in a log aggregator.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * "Client Closed Request" — nginx's convention, and the honest answer for a
 * request nobody was left to answer.
 *
 * `res.statusCode` cannot be used for these: nothing was written, so it is
 * still Node's default 200, and logging that counts every abandoned request as
 * a success.
 */
const CLIENT_CLOSED_REQUEST = 499;

export function requestLogger(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();
    let logged = false;

    // Captured on arrival, not in the callback. Express rewrites `req.url` —
    // and with it `req.path` — to be relative to the deepest mount point the
    // request is currently inside, restoring it only as the router unwinds. A
    // request the client abandons mid-handler fires `close` before that unwind,
    // so reading the path later logged a bare `/` in place of the real route.
    // `originalUrl` is never rewritten; the query string is cut off it because
    // the values are exactly what must not be logged.
    const path = req.originalUrl.split('?')[0] ?? req.path;
    const queryKeys = Object.keys(req.query);

    const complete = (outcome: 'finished' | 'aborted'): void => {
      if (logged) {
        return;
      }

      logged = true;
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      req.log.info('request completed', {
        method: req.method,
        path,
        queryKeys,
        status: res.headersSent ? res.statusCode : CLIENT_CLOSED_REQUEST,
        durationMs: Math.round(durationMs * 100) / 100,
        outcome,
      });
    };

    res.on('finish', () => complete('finished'));
    res.on('close', () => complete(res.writableEnded ? 'finished' : 'aborted'));

    next();
  };
}
