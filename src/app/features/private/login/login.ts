import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, STUB_REJECTED_PASSWORD } from '../../../core/auth';
import { isDevAuthStubActive } from '../../../core/config/auth.config';
import { PRIVATE_ROUTES } from '../../../core/config/private-routes.config';
import { SITE, WORKSHOP_GALLERY } from '../../../core/data';
import { ApiError, type GalleryImage, type IconName } from '../../../core/models';
import { Icon } from '../../../shared/components/icon/icon';
import { ResponsiveImage } from '../../../shared/components/responsive-image/responsive-image';
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
 * parameter — a refused request lands on a plain `/private/login` — and the
 * input is not declared, so `withComponentInputBinding()` cannot bind a crafted
 * one either. That second half matters: keeping the input while dropping the
 * validation would turn `/private/login?redirect=https://evil.example` into an
 * open redirect, which is exactly the shape used for phishing. Not accepting
 * the parameter at all is the version with no surface to get wrong.
 *
 * WHY THE WAY OUT IS A `routerLink`, NOT AN `href`
 * ------------------------------------------------
 * "Voltar ao site" used to be `href="/"`, which is the site root only when the
 * application is served from one. GitHub Pages serves it from
 * `/fsautomotive.pt.angular/`, so the link left the deployment entirely and
 * landed on `sadiq-x.github.io`. `routerLink="/"` is resolved against the
 * `<base href>` the build injects, so it points at the home page in every
 * deployment — and navigates in place instead of reloading the bundle.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Icon, ResponsiveImage, UiButton],
  templateUrl: './login.html',
  host: { class: 'block min-h-dvh bg-ink-950' },
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly site = SITE;

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitting = this.auth.pending;
  protected readonly stubActive = isDevAuthStubActive();
  protected readonly stubRejectedPassword = STUB_REJECTED_PASSWORD;

  /**
   * Reveal toggle for the password field. Typing a long password blind is the
   * most common reason a sign-in fails twice, and a workshop terminal is not a
   * shoulder-surfing risk in the way a train is — so the control exists, but
   * it starts hidden and reverts on every submission.
   */
  protected readonly passwordVisible = signal(false);

  protected readonly canSubmit = computed(
    () => !this.submitting() && !!this.email().trim() && !!this.password(),
  );

  /**
   * The photograph behind the brand panel. It is decorative here — the panel's
   * own text carries the meaning — so the gallery's alt text is dropped rather
   * than read out to a screen reader that has no use for it.
   */
  protected readonly panelImage: GalleryImage = { ...WORKSHOP_GALLERY[5], alt: '' };

  /**
   * What the area actually does, shown beside the form on wide screens. Three
   * claims, each matching a page behind the login — a sign-in panel that
   * promises more than the product delivers is just a lie with a photograph.
   */
  protected readonly highlights: readonly { icon: IconName; label: string; detail: string }[] = [
    {
      icon: 'dashboard',
      label: 'Painel do dia',
      detail: 'Clientes, viaturas e folhas de obra num só relance.',
    },
    {
      icon: 'car',
      label: 'Viaturas e histórico',
      detail: 'Pesquisa por matrícula, com as intervenções associadas.',
    },
    {
      icon: 'calendar',
      label: 'Agenda de marcações',
      detail: 'O mês inteiro em calendário, com marcação nova em dois passos.',
    },
  ];

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected async submit(): Promise<void> {
    this.errorMessage.set(null);
    this.passwordVisible.set(false);

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
