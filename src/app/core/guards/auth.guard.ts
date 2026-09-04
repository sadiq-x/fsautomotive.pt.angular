/**
 * Route guards for the private area.
 *
 * WHAT A GUARD IS AND IS NOT
 * --------------------------
 * These control navigation and the shape of the experience — they are not a
 * security boundary. Everything here runs in the visitor's browser and can be
 * bypassed by anyone willing to open the developer tools. The backend decides
 * what data a request may have; a guard only decides which screen to show while
 * that is being asked. Both layers are needed, and neither substitutes for the
 * other.
 *
 * The subtle part is `status === 'unknown'`. On a hard refresh the app has not
 * yet asked whether the session cookie is valid, so the guard awaits
 * `restore()` before deciding. Treating `unknown` as "not signed in" is the
 * classic bug: every refresh would bounce a signed-in user to the login page.
 */
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import type { Permission } from '../auth/auth.models';
import { NotificationService } from '../services/notification.service';
import { PRIVATE_ROUTES } from '../config/private-routes.config';

/**
 * Requires a signed-in user.
 *
 * An anonymous visitor is sent to `/gestao`, plain — no `?redirect=`. The URL
 * they wanted is deliberately not carried: one clean address is what a person
 * turned away should see, and after signing in they land on the dashboard.
 *
 * Dropping it also removes the open-redirect surface entirely. A `?redirect=`
 * parameter is exactly the shape attackers phish with, and the safest version
 * of a parameter you must validate is the one you never accept.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restore();

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([PRIVATE_ROUTES.login]);
};

/**
 * Keeps a signed-in user off the login page.
 *
 * Without it, following a bookmarked `/gestao/entrar` while already signed in
 * shows a form that cannot do anything useful.
 */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restore();

  return auth.isAuthenticated() ? router.createUrlTree([PRIVATE_ROUTES.dashboard]) : true;
};

/**
 * Requires at least one of the given permissions.
 *
 * A factory rather than a route-data lookup, so the requirement is written at
 * the route in a form the compiler checks: a misspelled permission does not
 * compile, where `data: { permissions: ['officgest.read'] }` would silently
 * lock everyone out.
 */
export function permissionGuard(...permissions: readonly Permission[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notifications = inject(NotificationService);

    await auth.restore();

    if (!auth.isAuthenticated()) {
      return router.createUrlTree([PRIVATE_ROUTES.login]);
    }

    if (auth.hasAnyPermission(permissions)) {
      return true;
    }

    // Silently redirecting looks like a broken link. Saying why does not leak
    // anything: the user already knows which page they tried to open.
    notifications.warning('Não tem permissão para aceder a essa área.');

    // The same door as every other refusal. For a signed-in user `/gestao`
    // resolves on to the dashboard, so this costs one hop and buys a single
    // answer to "where does the private area send someone it turned away".
    return router.createUrlTree([PRIVATE_ROUTES.base]);
  };
}
