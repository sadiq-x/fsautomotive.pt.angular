/**
 * Who is calling, and whether they may.
 *
 * TWO WAYS IN, ONE DECISION
 * -------------------------
 * A caller is either a signed-in person holding a session cookie, or another
 * service holding an `x-api-key`. Both are legitimate and they are not
 * interchangeable: the browser cannot hold a key (everything in the bundle is
 * public), and a server-to-server caller has no session. Deciding once, here,
 * is what stops two independent guards from each rejecting the request the
 * other would have allowed.
 *
 * `identify` never refuses anything — it only establishes who is asking, so
 * that a handler and the guards below read the same answer. Refusal is
 * `requireAccess`, and authorisation is `requirePermission`.
 *
 * WHY "NOTHING CONFIGURED" MEANS "OPEN"
 * -------------------------------------
 * A fresh checkout with no `BACKEND_API_KEYS` and no accounts is a development
 * machine talking to a sandbox tenant, and demanding a credential nobody has
 * created yet would only teach people to disable the guard. The rule is
 * therefore not "open unless locked" but "satisfy every guard that exists":
 * configure either mechanism and anonymous access ends immediately. The
 * `startupWarnings` below exist so an unguarded *production* deployment is
 * loud rather than merely possible.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { config } from '../config/index.js';
import { grantsAny, type Permission } from '../modules/auth/auth.model.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import { readSessionToken } from '../modules/auth/session.cookie.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/index.js';
import { createApiKeyVerifier } from './api-key.middleware.js';

/** Establishes `req.principal`. Mount before any guard that reads it. */
export function identify(auth: AuthService): RequestHandler {
  const apiKeys = createApiKeyVerifier();
  const cookie = config.auth.cookie;
  const guarded = auth.enabled || apiKeys.configured;

  return (req: Request, _res: Response, next: NextFunction): void => {
    // A session first: it is the more specific answer, and a browser that holds
    // both should be treated as the person it signed in as, not as a service.
    const user = auth.enabled ? auth.resolve(readSessionToken(req, cookie)) : null;

    if (user) {
      req.principal = { kind: 'session', user };
    } else if (apiKeys.matches(req)) {
      req.principal = { kind: 'api-key' };
    } else {
      req.principal = guarded ? { kind: 'anonymous' } : { kind: 'unguarded' };
    }

    next();
  };
}

/**
 * Requires a caller that satisfied one of the configured mechanisms.
 *
 * Only `anonymous` is refused, and `identify` produces that kind only when a
 * mechanism exists to have failed. That is the whole of the "satisfy every
 * guard that exists" rule, in one comparison — and it lives in the principal
 * rather than in a boolean each guard has to remember to consult.
 */
export function requireAccess(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.principal?.kind !== 'anonymous') {
      next();
      return;
    }

    // The log records the refusal; it never records the key or cookie offered.
    req.log.warn('rejected an unauthenticated request', {
      path: req.path,
      hasApiKey: typeof req.headers['x-api-key'] === 'string',
      hasCookie: typeof req.headers.cookie === 'string',
    });

    next(new UnauthorizedError('É necessário iniciar sessão para aceder a este recurso.'));
  };
}

/**
 * Requires at least one of the given permissions.
 *
 * A factory taking the permissions as arguments rather than reading them from
 * `route.data`, so the requirement is written at the route in a form the
 * compiler checks: a misspelled permission does not compile, where a string in
 * a configuration object would silently lock everyone out — or, far worse,
 * silently let everyone in.
 *
 * A caller authenticated by API key is not subject to these. Such a key is
 * issued to a trusted service rather than to a person, it carries no identity
 * to attach permissions to, and inventing an implicit permission set for it
 * would mean this service's authorisation model had two answers to every
 * question. What bounds an API-key caller is which keys exist.
 */
export function requirePermission(...permissions: readonly Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const principal = req.principal;

    if (!principal || principal.kind === 'anonymous') {
      next(new UnauthorizedError('É necessário iniciar sessão para aceder a este recurso.'));
      return;
    }

    if (principal.kind !== 'session') {
      // An API key or an unguarded deployment. Neither carries an identity to
      // attach permissions to, and both were already accepted upstream.
      next();
      return;
    }

    if (grantsAny(principal.user.permissions, permissions)) {
      next();
      return;
    }

    req.log.warn('rejected a request the session is not permitted to make', {
      path: req.path,
      userId: principal.user.id,
      required: permissions,
    });

    next(new ForbiddenError('Não tem permissão para aceder a este recurso.'));
  };
}

/**
 * Cross-site request forgery, at the only place it can reach this service.
 *
 * The session cookie is `SameSite=Lax`, so a browser will not attach it to a
 * cross-site `POST` — that is the primary defence and it is enough on its own
 * for every browser this decade. This is the second lock, and it costs a string
 * comparison:
 *
 * - It closes `SameSite=None`, which a genuinely cross-site deployment must
 *   configure and which switches the primary defence off entirely.
 * - It does not depend on the CORS layer. CORS stops an attacker *reading* a
 *   response; it does not stop the request being made, and a request that
 *   creates an appointment has already done its damage by then.
 *
 * A request with no `Origin` is allowed: that is `curl`, a health check or any
 * server-to-server caller — none of which a browser can be tricked into being.
 * Safe methods are skipped, because forging a read that nobody can read is not
 * an attack.
 */
export function enforceOrigin(): RequestHandler {
  const allowed = new Set(config.cors.allowedOrigins);
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (SAFE_METHODS.has(req.method) || typeof origin !== 'string' || origin === 'null') {
      next();
      return;
    }

    if (allowed.has(origin) || isSameOrigin(origin, req)) {
      next();
      return;
    }

    req.log.warn('rejected a cross-origin state-changing request', { path: req.path, origin });

    next(new ForbiddenError('Pedido recusado: origem não autorizada.'));
  };
}

/**
 * Whether the `Origin` names the host this request arrived at.
 *
 * A same-origin deployment — the site and the API behind one reverse proxy — is
 * the common case, and its origin is never in `CORS_ALLOWED_ORIGINS` because no
 * cross-origin permission is needed for it. Comparing against the `Host` header
 * is what keeps such a deployment working without asking anyone to list their
 * own origin as a foreign one.
 */
function isSameOrigin(origin: string, req: Request): boolean {
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/**
 * Configuration worth complaining about at startup.
 *
 * Returned rather than logged so `server.ts` decides what to do with them, and
 * so this stays a pure function a test can assert on. "It warned in production"
 * is a claim about behaviour; a `console.warn` buried in a middleware is not.
 */
export function startupWarnings(auth: AuthService): readonly string[] {
  const warnings: string[] = [];

  if (!auth.enabled && !createApiKeyVerifier().configured) {
    warnings.push(
      'No access control is configured: every endpoint is open to anyone who can ' +
        'reach this process. Set AUTH_USERS (or AUTH_USERS_FILE) with ' +
        'AUTH_SESSION_SECRET for browser sign-in, and/or BACKEND_API_KEYS for ' +
        'service-to-service callers.',
    );
  }

  if (!auth.enabled) {
    warnings.push(
      'Sign-in is off, so the private area of the site cannot be used: ' +
        '/api/auth/login is not mounted. See server/.env.example.',
    );
  }

  if (config.cors.allowedOrigins.length === 0) {
    warnings.push(
      'CORS_ALLOWED_ORIGINS is empty, so no browser origin may call this service. ' +
        'Set it to the origin the site is served from.',
    );
  }

  return warnings;
}
