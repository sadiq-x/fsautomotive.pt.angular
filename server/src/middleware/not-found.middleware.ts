/**
 * Turns an unmatched route into the same error shape as everything else.
 *
 * Without it, Express answers with its own HTML page — a different content type
 * and a different body from every other failure this API produces, which is
 * exactly the inconsistency a client's error handling trips over.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { NotFoundError } from '../shared/errors/index.js';

export function notFound(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    next(new NotFoundError(`No route matches ${req.method} ${req.path}.`));
  };
}
