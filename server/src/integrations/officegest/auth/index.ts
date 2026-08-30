/**
 * Chooses the authentication strategy for the configured credential.
 *
 * The `switch` is exhaustive over the credential union, so adding a mode to the
 * configuration will not compile until it is handled here.
 */
import type { OfficeGestCredentials } from '../../../config/index.js';
import type { OfficeGestAuthStrategy, UnauthenticatedRequest } from './auth-strategy.js';
import { BasicAuthStrategy } from './basic-auth.strategy.js';
import { BearerLoginStrategy } from './bearer-login.strategy.js';
import { StaticTokenStrategy } from './static-token.strategy.js';

export function createAuthStrategy(
  credentials: OfficeGestCredentials,
  request: UnauthenticatedRequest,
): OfficeGestAuthStrategy {
  switch (credentials.mode) {
    case 'bearer-login':
      return new BearerLoginStrategy(credentials.username, credentials.password, request);
    case 'basic':
      return new BasicAuthStrategy(credentials.username, credentials.password);
    case 'static-token':
      return new StaticTokenStrategy(credentials.token);
    default: {
      const exhaustive: never = credentials;
      throw new Error(`Unsupported OfficeGest auth mode: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export type { OfficeGestAuthStrategy, UnauthenticatedRequest } from './auth-strategy.js';
export { BasicAuthStrategy } from './basic-auth.strategy.js';
export { BearerLoginStrategy } from './bearer-login.strategy.js';
export { StaticTokenStrategy } from './static-token.strategy.js';
