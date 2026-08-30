import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, STUB_REJECTED_PASSWORD } from '../../../core/auth';
import { isDevAuthStubActive } from '../../../core/config/auth.config';
import { PRIVATE_ROUTES } from '../../../core/config/private-routes.config';
import { ApiError } from '../../../core/models';
import { Icon } from '../../../shared/components/icon/icon';
import { UiButton } from '../../../shared/components/ui-button/ui-button';

/**
 * The way in to the private area.
 *
 * WHY THE ERROR HANDLING LOOKS LIKE THIS
 * --------------------------------------
 * A failed sign-in is the one error in this application that must *not* be
 * announced by the shared toast queue: it belongs beside the form, tied to the
 * fields by `aria-describedby`, so a screen-reader user hears it when they land
 * on the inputs rather than as a message floating somewhere else. It also stays
 * on screen until something changes, which a toast would not.
 *
 * The message is deliberately the same for an unknown e-mail and a wrong
 * password. Distinguishing them tells an attacker which addresses are
 * registered.
 *
 * WHERE IT SENDS THE USER
 * -----------------------
 * Back to `redirect`, when the guard supplied one — a bookmark to a customer
 * page should survive signing in. The value is checked to be a path within the
 * private area before it is used: an unvalidated redirect parameter is an open
 * redirect, and this is exactly the form attackers phish with.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, UiButton],
  templateUrl: './login.html',
  host: { class: 'flex min-h-dvh flex-col bg-ink-950' },
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Bound from `?redirect=` by `withComponentInputBinding()`.
   *
   * It must be an `input()`, not a plain signal: the router writes to component
   * *inputs*, so a signal field would silently stay `undefined` and every
   * sign-in would land on the dashboard, discarding the page the user asked
   * for.
   */
  readonly redirect = input<string | undefined>(undefined);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitting = this.auth.pending;
  protected readonly stubActive = isDevAuthStubActive();
  protected readonly stubRejectedPassword = STUB_REJECTED_PASSWORD;

  protected async submit(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await this.auth.login({ email: this.email().trim(), password: this.password() });
      await this.router.navigateByUrl(this.safeRedirect());
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError && error.status === 401
          ? 'E-mail ou palavra-passe incorretos.'
          : 'Não foi possível iniciar sessão. Tente novamente dentro de momentos.',
      );
    }
  }

  /**
   * Only a path inside the private area is accepted.
   *
   * `//evil.example` and `https://evil.example` are both rejected: the first is
   * a protocol-relative URL that most naive checks miss.
   */
  private safeRedirect(): string {
    const target = this.redirect();

    if (
      target &&
      target.startsWith(`${PRIVATE_ROUTES.base}/`) &&
      !target.startsWith('//') &&
      target !== PRIVATE_ROUTES.login
    ) {
      return target;
    }

    return PRIVATE_ROUTES.dashboard;
  }
}
