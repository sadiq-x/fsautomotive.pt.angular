/**
 * The signed-in session, as signals.
 *
 * WHY A SERVICE AND NOT A STATE LIBRARY
 * -------------------------------------
 * This is one small piece of shared state with three transitions. A store
 * library would add a dependency, an action vocabulary and indirection to
 * replace four signals that the guards, the header and the login page can read
 * directly — and the project already models shared state exactly this way (see
 * `ConsentService`). Signals also suit the app's zoneless change detection,
 * where an observable would need `toSignal` at every consumer anyway.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * Store a token. The session is an `HttpOnly` cookie the browser holds and
 * JavaScript cannot read, so there is nothing here for an XSS flaw to steal.
 * "Am I signed in?" is answered by asking the backend once at start-up, not by
 * inspecting storage — see `restore()`.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthGateway } from './auth.gateway';
import type { AuthStatus, Credentials, Permission, SessionUser } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly gateway = inject(AuthGateway);

  private readonly state = signal<AuthStatus>('unknown');
  private readonly currentUser = signal<SessionUser | null>(null);
  private readonly busy = signal(false);
  /** De-duplicates concurrent `restore()` calls from several guards at once. */
  private restoring: Promise<void> | null = null;

  /** `unknown` until `restore()` has answered — guards must wait for it. */
  readonly status = this.state.asReadonly();
  readonly user = this.currentUser.asReadonly();
  /** `true` while a login, logout or restore is in flight. */
  readonly pending = this.busy.asReadonly();

  readonly isAuthenticated = computed(() => this.state() === 'authenticated');
  readonly permissions = computed<readonly Permission[]>(
    () => this.currentUser()?.permissions ?? [],
  );

  /** Initials for the account menu avatar, e.g. "Miguel Faria" → "MF". */
  readonly initials = computed(() => {
    const name = this.currentUser()?.name.trim();

    if (!name) {
      return '';
    }

    const parts = name.split(/\s+/);
    const first = parts.at(0)?.[0] ?? '';
    const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';

    return (first + last).toUpperCase();
  });

  /**
   * Asks the backend whether the cookie names a valid session.
   *
   * Called by the auth guard rather than in a constructor: a visitor who never
   * opens the private area should not cause a request. Concurrent callers share
   * one in-flight promise, so several guards resolving at once make one call.
   */
  restore(): Promise<void> {
    if (this.state() !== 'unknown') {
      return Promise.resolve();
    }

    this.restoring ??= this.performRestore().finally(() => {
      this.restoring = null;
    });

    return this.restoring;
  }

  async login(credentials: Credentials): Promise<void> {
    this.busy.set(true);

    try {
      const user = await firstValueFrom(this.gateway.login(credentials));
      this.currentUser.set(user);
      this.state.set('authenticated');
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Ends the session.
   *
   * Local state is cleared even when the request fails: the user asked to be
   * signed out, and leaving them apparently signed in on a shared machine
   * because the network hiccuped is the worse outcome.
   */
  async logout(): Promise<void> {
    this.busy.set(true);

    try {
      await firstValueFrom(this.gateway.logout());
    } catch {
      /* deliberately ignored — see above */
    } finally {
      this.clear();
      this.busy.set(false);
    }
  }

  /** Drops the session without calling the backend. Used by the 401 handler. */
  clear(): void {
    this.currentUser.set(null);
    this.state.set('anonymous');
  }

  hasPermission(permission: Permission): boolean {
    const granted = this.permissions();
    // `officegest.read` is the umbrella grant for every read-only OfficeGest
    // view, so a simple deployment can issue one permission instead of five.
    //
    // It is scoped to its own namespace on purpose. Permissions outside it
    // (`settings.read`, `workers.read`) guard screens that are not OfficeGest
    // data, and a grant named after one system must not silently open another.
    return (
      granted.includes(permission) ||
      (permission.startsWith('officegest.') &&
        permission.endsWith('.read') &&
        granted.includes('officegest.read'))
    );
  }

  hasAnyPermission(permissions: readonly Permission[]): boolean {
    return (
      permissions.length === 0 || permissions.some((permission) => this.hasPermission(permission))
    );
  }

  private async performRestore(): Promise<void> {
    this.busy.set(true);

    try {
      const user = await firstValueFrom(this.gateway.session());

      if (user) {
        this.currentUser.set(user);
        this.state.set('authenticated');
        return;
      }

      this.clear();
    } catch {
      // Every failure resolves to "anonymous". A 401 is the ordinary answer for
      // a visitor who is not signed in; anything else (backend down, CORS) is
      // indistinguishable from here. What must not happen is leaving `status`
      // at `unknown`, which would hang every guard for ever.
      this.clear();
    } finally {
      this.busy.set(false);
    }
  }
}
