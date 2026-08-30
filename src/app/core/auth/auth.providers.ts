/**
 * Chooses which authentication adapter the application runs on.
 *
 * The choice is made once, here, at bootstrap — not inside `AuthService`, which
 * must not know that a stub exists. Adding a third adapter (SSO, for instance)
 * is a new class and one branch in this function.
 */
import { type EnvironmentProviders, isDevMode, makeEnvironmentProviders } from '@angular/core';

import { isDevAuthStubActive } from '../config/auth.config';
import { AuthGateway, HttpAuthGateway } from './auth.gateway';
import { DevAuthGateway } from './dev-auth.gateway';

export function provideAuth(): EnvironmentProviders {
  const useStub = isDevAuthStubActive();

  if (useStub && !isDevMode()) {
    // Unreachable — `isDevAuthStubActive` already checks this. Kept as an
    // assertion because the cost of the check being wrong is a production
    // build that accepts any password.
    throw new Error('The development authentication stub cannot be used in production.');
  }

  if (useStub) {
    // eslint-disable-next-line no-console
    console.warn(
      '[auth] Development stub active: ANY password is accepted. ' +
        'Unset DEV_AUTH_STUB in .env to use the real backend.',
    );
  }

  return makeEnvironmentProviders([
    { provide: AuthGateway, useClass: useStub ? DevAuthGateway : HttpAuthGateway },
  ]);
}
