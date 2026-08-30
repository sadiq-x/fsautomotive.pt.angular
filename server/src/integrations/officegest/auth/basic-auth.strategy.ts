/**
 * HTTP Basic authentication — the mechanism documented for the OfficeGest v1
 * API (`curl -u user:pass https://<tenant>.officegest.com/api/...`).
 *
 * Stateless: the header is a pure function of the credential, so there is
 * nothing to cache, expire or refresh. A 401 here can only mean the credential
 * is wrong, which is why `onUnauthorized` refuses a retry — replaying it would
 * turn one clear misconfiguration into a burst of failed logins against the
 * tenant, and some deployments lock an account for that.
 */
import type { OfficeGestAuthStrategy } from './auth-strategy.js';

export class BasicAuthStrategy implements OfficeGestAuthStrategy {
  readonly mode = 'basic';
  private readonly header: string;

  constructor(username: string, password: string) {
    // Encoded once, at construction: the credential never appears in a local
    // variable on the request path where a future log line could pick it up.
    this.header = `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
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
