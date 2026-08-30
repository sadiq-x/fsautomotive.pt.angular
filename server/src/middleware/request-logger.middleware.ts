/**
 * One log line per finished request.
 *
 * Logged on `finish` rather than on arrival, because the useful facts — status
 * and duration — only exist at the end. Requests that are never answered still
 * appear, via `close`, which is what makes a client that hangs up mid-upstream
 * call visible instead of silent.
 *
 * The URL is logged as `req.route`-independent path plus the *names* of the
 * query parameters, never their values: a search term can contain a customer's
 * name or plate, and that does not belong in a log aggregator.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function requestLogger(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();
    let logged = false;

    const complete = (outcome: 'finished' | 'aborted'): void => {
      if (logged) {
        return;
      }

      logged = true;
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      req.log.info('request completed', {
        method: req.method,
        path: req.path,
        queryKeys: Object.keys(req.query),
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        outcome,
      });
    };

    res.on('finish', () => complete('finished'));
    res.on('close', () => complete(res.writableEnded ? 'finished' : 'aborted'));

    next();
  };
}
