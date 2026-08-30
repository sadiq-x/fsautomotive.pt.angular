/**
 * Gives every request an id and a logger that carries it.
 *
 * WHY IT RUNS FIRST
 * -----------------
 * Without a correlation id, a production incident is a pile of unrelated log
 * lines: the upstream timeout, the retry and the 502 the user saw cannot be
 * connected. With one, they are a single `grep`. The id is echoed in the
 * response header and in every error body, so a user can quote it and land
 * straight on the right lines.
 *
 * An inbound `x-request-id` is honoured so a trace started at a proxy or in the
 * browser continues here — but it is sanitised first: it is caller-controlled
 * input, and it goes into log records.
 *
 * It also opens the request's `AbortSignal`. Express does not provide one, and
 * without it a client that navigates away leaves this service waiting on an
 * upstream call whose result nobody will read — quota and a connection spent on
 * nothing. Aborting on an unfinished `close` propagates the hang-up all the way
 * to OfficeGest.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { randomUUID } from 'node:crypto';

import { logger } from '../shared/logger.js';

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 64;
const UNSAFE_CHARACTERS = /[^A-Za-z0-9_.:-]/g;

function resolveRequestId(header: unknown): string {
  if (typeof header !== 'string') {
    return randomUUID();
  }

  const sanitised = header.trim().slice(0, MAX_REQUEST_ID_LENGTH).replace(UNSAFE_CHARACTERS, '');

  return sanitised === '' ? randomUUID() : sanitised;
}

export function requestContext(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.id = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    req.log = logger.child({ requestId: req.id });

    const controller = new AbortController();
    req.abortSignal = controller.signal;

    res.on('close', () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    res.setHeader(REQUEST_ID_HEADER, req.id);
    next();
  };
}
