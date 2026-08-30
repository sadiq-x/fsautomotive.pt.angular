/**
 * Schema validation for path parameters, query strings and request bodies.
 *
 * WHY VALIDATION IS MIDDLEWARE AND NOT A LINE IN THE CONTROLLER
 * ------------------------------------------------------------
 * Every controller needs it, every controller would implement it slightly
 * differently, and the one that forgets is the vulnerability. Running it as a
 * route-level guard means a request that reaches a controller is already known
 * to be well-formed — the controller has no invalid-input branch to write, and
 * no reason to re-check.
 *
 * WHY IT RETURNS A PAIR
 * ---------------------
 * Express 5 exposes `req.query` through a getter, so validated values cannot be
 * written back over the raw ones. Storing them on `req.validated` solves that
 * but loses the type. `validationFor` therefore returns the middleware together
 * with a `read` function bound to the same schemas, so the controller gets the
 * inferred type with no cast and no chance of reading a field nobody validated.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

import { AppError, ERROR_CODES } from '../shared/errors/index.js';

export interface ValidationSchemas {
  readonly params?: z.ZodTypeAny;
  readonly query?: z.ZodTypeAny;
  readonly body?: z.ZodTypeAny;
}

/** The validated shape implied by a set of schemas. */
export type Validated<S extends ValidationSchemas> = {
  readonly params: S['params'] extends z.ZodTypeAny ? z.infer<S['params']> : undefined;
  readonly query: S['query'] extends z.ZodTypeAny ? z.infer<S['query']> : undefined;
  readonly body: S['body'] extends z.ZodTypeAny ? z.infer<S['body']> : undefined;
};

/** A single field-level problem, safe to return to the caller. */
interface ValidationIssue {
  readonly source: 'params' | 'query' | 'body';
  readonly field: string;
  readonly message: string;
}

function collectIssues(source: ValidationIssue['source'], error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    source,
    field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

export interface Validator<S extends ValidationSchemas> {
  readonly middleware: RequestHandler;
  /** Typed accessor for what the middleware validated. */
  readonly read: (req: Request) => Validated<S>;
}

export function validationFor<S extends ValidationSchemas>(schemas: S): Validator<S> {
  const middleware: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
    const issues: ValidationIssue[] = [];
    const validated: Record<string, unknown> = {
      params: undefined,
      query: undefined,
      body: undefined,
    };

    // All three sources are checked before failing, so a caller with mistakes
    // in two places fixes both in one round trip.
    for (const source of ['params', 'query', 'body'] as const) {
      const schema = schemas[source];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[source]);

      if (result.success) {
        validated[source] = result.data;
      } else {
        issues.push(...collectIssues(source, result.error));
      }
    }

    if (issues.length > 0) {
      next(
        new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'The request did not pass validation.', {
          details: issues,
        }),
      );
      return;
    }

    req.validated = validated as Request['validated'];
    next();
  };

  return {
    middleware,
    read: (req: Request) => req.validated as Validated<S>,
  };
}
