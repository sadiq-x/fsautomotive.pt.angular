/**
 * The OfficeGest v2 mechanism: exchange username and password at
 * `POST /auth/login` for a Bearer token, then send that token on every request.
 *
 * WHAT THIS FILE IS ACTUALLY FOR
 * ------------------------------
 * Three problems that only appear under real traffic:
 *
 * 1. **A cold start must not log in N times.** Ten concurrent requests arriving
 *    at an empty cache would otherwise fire ten logins. `pendingLogin` makes
 *    the second through tenth await the first — one round trip, not ten.
 * 2. **Tokens expire mid-flight.** No amount of proactive checking removes the
 *    race, so the client hands a 401 back through `onUnauthorized()`, the cache
 *    is dropped, and the next attempt logs in again. `expires_in`, when the
 *    tenant sends it, only makes that path rarer.
 * 3. **A wrong password must not become a login loop.** `onUnauthorized()`
 *    grants exactly one refresh per credential generation: if the token we just
 *    minted is itself rejected, the credential is wrong and the answer is to
 *    fail, not to try harder.
 */
import { logger } from '../../../shared/logger.js';
import { AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, AUTH_TOKEN_FIELDS } from '../officegest.constants.js';
import { OfficeGestMalformedResponseError } from '../officegest.errors.js';
import { officeGestLoginResponseSchema } from '../officegest.types.js';
import type { OfficeGestAuthStrategy, UnauthenticatedRequest } from './auth-strategy.js';

/** Renew this long before the advertised expiry, to cover clock skew and flight time. */
const EXPIRY_SAFETY_MARGIN_MS = 30_000;

interface CachedToken {
  readonly token: string;
  /** Epoch ms after which the token is treated as gone, or `undefined` if unknown. */
  readonly expiresAt: number | undefined;
  /** Bumped on every successful login; see `onUnauthorized`. */
  readonly generation: number;
}

export class BearerLoginStrategy implements OfficeGestAuthStrategy {
  readonly mode = 'bearer-login';

  private cached: CachedToken | undefined;
  /** In-flight login shared by every concurrent caller. */
  private pendingLogin: Promise<CachedToken> | undefined;
  private generation = 0;
  /** The generation whose 401 we have already answered with a refresh. */
  private lastRefusedGeneration = -1;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly request: UnauthenticatedRequest,
  ) {}

  async getAuthHeaders(signal?: AbortSignal): Promise<Readonly<Record<string, string>>> {
    const { token } = await this.getToken(signal);
    return { authorization: `Bearer ${token}` };
  }

  async onUnauthorized(): Promise<boolean> {
    const current = this.cached;

    if (!current) {
      // Nothing cached: either a concurrent caller already cleared it, or the
      // 401 came from the login call itself. Let the next attempt log in.
      return this.lastRefusedGeneration !== this.generation;
    }

    if (this.lastRefusedGeneration === current.generation) {
      // We already replaced the token once for this generation and OfficeGest
      // rejected the replacement too. The credential is wrong.
      logger.error('OfficeGest rejected a freshly issued token — check the credentials', {
        authMode: this.mode,
      });
      return false;
    }

    this.lastRefusedGeneration = current.generation;
    this.cached = undefined;
    logger.warn('OfficeGest token rejected; discarding it and re-authenticating', {
      authMode: this.mode,
    });
    return true;
  }

  async dispose(): Promise<void> {
    const token = this.cached?.token;
    this.cached = undefined;

    if (!token) {
      return;
    }

    // Courtesy only: a tenant that caps concurrent sessions benefits, and a
    // failure here must never hold up shutdown.
    try {
      await this.request({ path: AUTH_LOGOUT_PATH, method: 'DELETE' });
    } catch (error) {
      logger.debug('OfficeGest logout failed during shutdown; ignoring', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async getToken(signal?: AbortSignal): Promise<CachedToken> {
    const current = this.cached;

    if (current && !this.isExpired(current)) {
      return current;
    }

    // Collapse concurrent misses onto one login.
    this.pendingLogin ??= this.login(signal).finally(() => {
      this.pendingLogin = undefined;
    });

    return this.pendingLogin;
  }

  private isExpired(token: CachedToken): boolean {
    return token.expiresAt !== undefined && Date.now() >= token.expiresAt;
  }

  private async login(signal?: AbortSignal): Promise<CachedToken> {
    const startedAt = Date.now();

    const payload = await this.request({
      path: AUTH_LOGIN_PATH,
      method: 'POST',
      body: { username: this.username, password: this.password },
      signal,
    });

    const parsed = officeGestLoginResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new OfficeGestMalformedResponseError(
        { path: AUTH_LOGIN_PATH, method: 'POST' },
        parsed.error.issues,
      );
    }

    const token = this.extractToken(parsed.data.data);

    if (!token) {
      throw new OfficeGestMalformedResponseError(
        { path: AUTH_LOGIN_PATH, method: 'POST' },
        `login response contained none of: ${AUTH_TOKEN_FIELDS.join(', ')}`,
      );
    }

    const expiresIn = parsed.data.data['expires_in'];
    const issued: CachedToken = {
      token,
      expiresAt:
        typeof expiresIn === 'number'
          ? Date.now() + Math.max(0, expiresIn * 1000 - EXPIRY_SAFETY_MARGIN_MS)
          : undefined,
      generation: ++this.generation,
    };

    this.cached = issued;

    // The token itself is never logged — only that one was obtained.
    logger.info('Authenticated with OfficeGest', {
      authMode: this.mode,
      durationMs: Date.now() - startedAt,
      expiresInSeconds: typeof expiresIn === 'number' ? expiresIn : null,
    });

    return issued;
  }

  /** Reads the token from whichever of the documented field names is present. */
  private extractToken(data: Record<string, unknown>): string | undefined {
    for (const field of AUTH_TOKEN_FIELDS) {
      const value = data[field];

      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return undefined;
  }
}
