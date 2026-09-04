import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
 * Always the dashboard.
 *
 * There is deliberately no `?redirect=` handling. Nothing generates the
 * parameter — a refused request lands on a plain `/gestao` — and the input is
 * not declared, so `withComponentInputBinding()` cannot bind a crafted one
 * either. That second half matters: keeping the input while dropping the
 * validation would turn `/gestao?redirect=https://evil.example` into an open
 * redirect, which is exactly the shape used for phishing. Not accepting the
 * parameter at all is the version with no surface to get wrong.
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
      await this.router.navigateByUrl(PRIVATE_ROUTES.dashboard);
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError && error.status === 401
          ? 'E-mail ou palavra-passe incorretos.'
          : 'Não foi possível iniciar sessão. Tente novamente dentro de momentos.',
      );
    }
  }
}
