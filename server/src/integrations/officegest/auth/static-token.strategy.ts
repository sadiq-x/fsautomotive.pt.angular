/**
 * A pre-issued token sent as `Authorization: Bearer <token>`.
 *
 * ⚠️ NOT A DOCUMENTED MECHANISM.
 * -----------------------------
 * OfficeGest's published documentation describes exactly two ways to
 * authenticate: HTTP Basic (v1) and a token obtained from `POST /auth/login`
 * (v2). It does not describe a standalone, long-lived API key. This strategy
 * exists for the case where a tenant was handed a ready-made token out of band
 * — it sends it in the header shape the v2 documentation specifies for a token,
 * which is the only defensible guess.
 *
 * Prefer `bearer-login`. If `static-token` returns 401 against your tenant, the
 * token is not a standalone credential and the mode is wrong for you.
 *
 * Like Basic, it is stateless: this service cannot re-issue a token it did not
 * mint, so a 401 is terminal rather than a reason to retry.
 */
import type { OfficeGestAuthStrategy } from './auth-strategy.js';

export class StaticTokenStrategy implements OfficeGestAuthStrategy {
  readonly mode = 'static-token';
  private readonly header: string;

  constructor(token: string) {
    this.header = `Bearer ${token}`;
  }

  async getAuthHeaders(): Promise<Readonly<Record<string, string>>> {
    return { authorization: this.header };
  }

  async onUnauthorized(): Promise<boolean> {
    return false;
  }

  async dispose(): Promise<void> {
    /* nothing to release */
  }
}
