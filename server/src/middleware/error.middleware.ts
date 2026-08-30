/**
 * The one place an error becomes a response.
 *
 * WHY CENTRALISED
 * ---------------
 * Controllers that format their own errors drift: one returns `{ error }`,
 * another `{ message }`, a third leaks a stack trace it meant to log. Funnelling
 * every failure through a single handler makes the envelope, the status mapping
 * and — most importantly — the redaction rule impossible to bypass.
 *
 * WHAT IT PROMISES
 * ----------------
 * - Every response body is the documented `{ success: false, error, requestId }`.
 * - An `AppError` speaks for itself: its message was written to be read by a
 *   caller.
 * - Anything else is a bug. It is logged in full, server-side, and answered with
 *   a generic message: an unexpected error's message can contain a file path, a
 *   query fragment or a credential, and none of that may cross the boundary.
 * - Stack traces are logged, never serialised.
 */
import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { config } from '../config/index.js';
import { isClientDisconnect, toAppError } from '../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../shared/errors/index.js';
import { failure } from '../shared/http/api-response.js';

/** Express's body parser tags its own failures; they are the caller's fault. */
interface BodyParserError extends Error {
  readonly type?: string;
  readonly status?: number;
  readonly statusCode?: number;
}

function fromBodyParser(error: BodyParserError): AppError | undefined {
  const status = error.status ?? error.statusCode;

  if (typeof status !== 'number' || status >= 500) {
    return undefined;
  }

  if (error.type === 'entity.too.large') {
    return new AppError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, 'The request body is too large.');
  }

  if (error.type === 'entity.parse.failed') {
    return new AppError(400, ERROR_CODES.BAD_REQUEST, 'The request body is not valid JSON.');
  }

  return undefined;
}

/** Normalises anything thrown into the `AppError` the response is built from. */
function normalise(error: unknown): AppError {
  // Integration failures first: this decides, once, whose fault a 401 is.
  const mapped = toAppError(error);

  if (mapped instanceof AppError) {
    return mapped;
  }

  if (mapped instanceof ZodError) {
    // A schema that ran outside the validation middleware — an upstream payload
    // check, typically. Still the shape of a validation failure.
    return new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'The request did not pass validation.', {
      details: mapped.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    });
  }

  if (mapped instanceof Error) {
    const parserError = fromBodyParser(mapped as BodyParserError);

    if (parserError) {
      return parserError;
    }
  }

  return new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred.', {
    cause: mapped,
  });
}

export function errorHandler(): ErrorRequestHandler {
  return (error: unknown, req: Request, res: Response, next: NextFunction): void => {
    // The socket is already gone; writing to it would only raise a second
    // error. The check is on the *response*: `req.destroyed` is true for any
    // request whose body was fully read, which is every POST — using it here
    // would swallow the error response instead of sending it.
    if (isClientDisconnect(error) || res.destroyed) {
      req.log.debug('request aborted by the client before a response was sent', { path: req.path });
      return;
    }

    // Express cannot change a response whose headers are already on the wire —
    // delegating lets it destroy the connection instead of corrupting the body.
    if (res.headersSent) {
      next(error);
      return;
    }

    const appError = normalise(error);
    const isServerFault = appError.httpStatus >= 500;

    const logFields = {
      status: appError.httpStatus,
      code: appError.code,
      method: req.method,
      path: req.path,
      error: {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        // Kept for the log only. Never reaches the response body.
        stack: isServerFault && error instanceof Error ? error.stack : undefined,
        cause:
          error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined,
      },
    };

    if (isServerFault) {
      req.log.error('request failed', logFields);
    } else {
      req.log.warn('request rejected', logFields);
    }

    if (appError.retryAfterSeconds !== undefined) {
      res.setHeader('Retry-After', appError.retryAfterSeconds);
    }

    // In development the real message is far more useful than the generic one,
    // and there is no client to protect. In production it is replaced.
    const message =
      appError.code === ERROR_CODES.INTERNAL_ERROR && !config.isProduction && error instanceof Error
        ? error.message
        : appError.message;

    res.status(appError.httpStatus).json(failure(appError.code, message, req.id, appError.details));
  };
}
