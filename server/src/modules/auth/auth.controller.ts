/**
 * HTTP for sign-in. Translation only — the decisions are in `auth.service.ts`.
 *
 * The one thing that is genuinely this layer's business is the cookie: the
 * service returns a token and a lifetime and knows nothing about headers, which
 * is what lets it be tested without a request.
 */
import type { Request, RequestHandler, Response } from 'express';

import type { AuthCookieConfig } from '../../config/auth.config.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { success } from '../../shared/http/api-response.js';
import { validationFor } from '../../middleware/validation.middleware.js';
import { loginBodySchema } from './auth.dto.js';
import type { AuthService } from './auth.service.js';
import { clearSessionCookie, readSessionToken, setSessionCookie } from './session.cookie.js';

export const loginValidator = validationFor({ body: loginBodySchema });

export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly cookie: AuthCookieConfig,
  ) {}

  readonly login: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { body } = loginValidator.read(req);

    const result = await this.service.login({
      email: body.email,
      password: body.password,
      // `trust proxy` is configured in `app.ts`, so this is the real client
      // address behind a load balancer rather than the balancer's own.
      address: req.ip ?? 'unknown',
      logger: req.log,
    });

    setSessionCookie(res, this.cookie, result.session.token, result.session.maxAgeSeconds);

    res.status(200).json(success(result.user));
  };

  /**
   * Who the caller is.
   *
   * A 401 here is the *expected* answer for a visitor who is not signed in —
   * the browser asks this on every hard refresh before it knows. The Angular
   * side marks the request accordingly so its own 401 handling stays quiet; see
   * `EXPECTS_UNAUTHORIZED` in `api.interceptor.ts`.
   */
  readonly session: RequestHandler = (req: Request, res: Response): void => {
    const user = req.principal?.kind === 'session' ? req.principal.user : null;

    if (!user) {
      throw new UnauthorizedError('Não existe uma sessão ativa.');
    }

    res.status(200).json(success(user));
  };

  /**
   * Ends the session.
   *
   * Always 204, even when the cookie named nothing. Signing out is not a query:
   * the caller's intent is "leave me signed out", and every path through this
   * handler achieves it. Reporting 401 to someone who is already signed out
   * would be a failure the client would have to special-case into a success.
   */
  readonly logout: RequestHandler = (req: Request, res: Response): void => {
    this.service.logout(readSessionToken(req, this.cookie));
    clearSessionCookie(res, this.cookie);

    res.status(204).end();
  };
}
