import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { ApiError, toValidationIssues } from '../../../../../core/models';
import { NotificationService } from '../../../../../core/services';
import { Icon } from '../../../../../shared/components/icon/icon';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';
import { OfficeGestService } from '../../services/officegest.service';
import type { CreateAppointmentRequest } from '../../models';

/**
 * Creates a booking.
 *
 * WHERE THE VALIDATION LIVES
 * --------------------------
 * In both places, deliberately, and they do different jobs. The checks here are
 * for the user: they run as the form is filled, name the field, and stop an
 * obviously wrong booking before it costs a round trip. The backend's checks
 * are the ones that count — it re-validates everything, and it is the only
 * layer that can, since anyone can post to the API directly.
 *
 * When the backend rejects something the form let through, its field errors are
 * mapped back onto the inputs rather than shown as a generic failure, so the
 * user sees which field to fix.
 *
 * WHY TEMPLATE-DRIVEN FORMS
 * -------------------------
 * Six fields, no cross-field logic beyond one comparison, and the project has
 * no reactive-forms usage to be consistent with. `ngModel` with signals keeps
 * this page shorter than the `FormGroup` wiring would, and the validation that
 * matters is stated explicitly above rather than encoded in validators.
 */
@Component({
  selector: 'app-appointment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, RouterLink, UiButton],
  templateUrl: './appointment-form.html',
  host: { class: 'block' },
})
export class AppointmentForm {
  private readonly officegest = inject(OfficeGestService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly routes = PRIVATE_ROUTES;

  protected readonly title = signal('');
  protected readonly startsAt = signal('');
  protected readonly endsAt = signal('');
  protected readonly plate = signal('');
  protected readonly customerId = signal('');
  protected readonly notes = signal('');

  protected readonly submitting = signal(false);
  /** Field name → message, filled locally and by the backend's 422. */
  protected readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly formError = signal<string | null>(null);

  /** The earliest value the datetime input will accept: now, to the minute. */
  protected readonly minDateTime = computed(() => toLocalInput(new Date()));

  protected readonly canSubmit = computed(
    () => !this.submitting() && this.title().trim().length >= 3 && this.startsAt() !== '',
  );

  protected async submit(): Promise<void> {
    this.formError.set(null);

    const errors = this.validate();

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }

    this.fieldErrors.set({});
    this.submitting.set(true);

    try {
      const created = await firstValueFrom(this.officegest.createAppointment(this.toRequest()));

      this.notifications.success('Marcação criada com sucesso.');
      await this.router.navigateByUrl(PRIVATE_ROUTES.appointment(created.id));
    } catch (error) {
      this.handleFailure(error);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Mirrors the backend's rules, so the common mistakes never leave the page. */
  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const title = this.title().trim();

    if (title.length < 3 || title.length > 160) {
      errors['title'] = 'Indique um assunto com 3 a 160 caracteres.';
    }

    const start = Date.parse(this.startsAt());

    if (Number.isNaN(start)) {
      errors['startsAt'] = 'Indique a data e hora de início.';
    } else if (start < Date.now() - 60_000) {
      errors['startsAt'] = 'A marcação tem de ser no futuro.';
    }

    if (this.endsAt()) {
      const end = Date.parse(this.endsAt());

      if (Number.isNaN(end)) {
        errors['endsAt'] = 'Data de fim inválida.';
      } else if (!Number.isNaN(start) && end <= start) {
        errors['endsAt'] = 'O fim tem de ser depois do início.';
      } else if (!Number.isNaN(start) && end - start > 12 * 60 * 60 * 1000) {
        errors['endsAt'] = 'A marcação não pode durar mais de 12 horas.';
      }
    }

    const plate = this.normalisedPlate();

    if (plate && !/^[A-Z0-9]{6}$/.test(plate)) {
      errors['plate'] = 'Matrícula inválida. Use o formato AA-00-BB.';
    }

    return errors;
  }

  private toRequest(): CreateAppointmentRequest {
    const plate = this.normalisedPlate();
    const customerId = this.customerId().trim();
    const notes = this.notes().trim();
    const endsAt = this.endsAt();

    // Only fields the user actually filled are sent: an empty string is not the
    // same statement as omitting the field, and the backend treats them
    // differently.
    return {
      title: this.title().trim(),
      startsAt: new Date(this.startsAt()).toISOString(),
      ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
      ...(plate ? { plate } : {}),
      ...(customerId ? { customerId } : {}),
      ...(notes ? { notes } : {}),
    };
  }

  private normalisedPlate(): string {
    return this.plate()
      .toUpperCase()
      .replace(/[\s._-]/g, '');
  }

  /** Maps a backend rejection back onto the fields where possible. */
  private handleFailure(error: unknown): void {
    if (!(error instanceof ApiError)) {
      this.formError.set('Não foi possível criar a marcação.');
      return;
    }

    const issues = toValidationIssues(error.details);

    if (issues.length > 0) {
      this.fieldErrors.set(Object.fromEntries(issues.map((issue) => [issue.field, issue.message])));
      this.formError.set('Corrija os campos assinalados.');
      return;
    }

    // 5xx and network failures are already announced by the error interceptor;
    // repeating them here would show the same message twice.
    if (!error.retryable) {
      this.formError.set(error.message);
    }
  }
}

/** `Date` → the `yyyy-MM-ddTHH:mm` a `datetime-local` input expects. */
function toLocalInput(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
