import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { LastUpdated } from '../../components/last-updated/last-updated';
import type { Appointment } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import { formatDateTime, formatPlate, orNull } from '../../utils/format';
import { formatPriority, formatStatus } from './appointment.labels';

/**
 * One booking.
 *
 * WHY THE FIELD LIST IS BUILT RATHER THAN WRITTEN OUT
 * ---------------------------------------------------
 * This page used to render a fixed list of seven fields, four of which this
 * tenant never sends — so every booking showed "Estado —, Matrícula —, Cliente
 * —, Notas —". That is not an empty state, it is noise that reads as a broken
 * page, and it buries the three fields that do carry something.
 *
 * So each field is added only when it has a value. The consequence is a page
 * that looks different for different bookings, which is correct: they *are*
 * different. A staff entry ("TIAGO FORMAÇÃO") genuinely has no vehicle, and
 * saying nothing about one is more honest than a dash.
 *
 * The fields themselves came from probing the live tenant — `employee_id`,
 * `priority` and `location` were being dropped by the mapper entirely, which is
 * why this screen had so little on it.
 */
@Component({
  selector: 'app-appointment-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage, LastUpdated, RouterLink],
  template: `
    <app-detail-page
      [status]="store.status()"
      [title]="store.data()?.title ?? 'Marcação'"
      [subtitle]="subtitle()"
      [backLink]="routes.appointments"
      backLabel="Marcações"
      [errorMessage]="store.error()?.message ?? null"
      missingMessage="Esta marcação não existe no OfficeGest ou foi removida."
    >
      <section class="rounded-xl bg-white p-6 shadow-card ring-1 ring-ink-950/6">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="text-h3 text-ink-900">Dados da marcação</h2>
          <app-last-updated [since]="lastUpdated()" />
        </div>

        <app-detail-list class="mt-5" [fields]="fields()" />

        @if (plateLink(); as plate) {
          <p class="mt-6 border-t border-ink-950/6 pt-5">
            <a
              class="rounded-sm font-semibold text-brand-700 underline decoration-brand-700/30 underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              [routerLink]="routes.vehicle(plate)"
            >
              Ver a viatura {{ formatPlate(plate) }}
            </a>
          </p>
        }
      </section>
    </app-detail-page>
  `,
})
export class AppointmentDetail {
  /** Bound from the `:appointmentId` route parameter. */
  readonly appointmentId = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;
  protected readonly formatPlate = formatPlate;

  /** Set from the response, so it is the moment the data actually arrived. */
  private readonly fetchedAt = signal<Date | null>(null);

  protected readonly store = createResourceDetail({
    id: this.appointmentId,
    fetch: (id) =>
      this.officegest.getAppointment(id).pipe(tap(() => this.fetchedAt.set(new Date()))),
  });

  /** Empty when the roster is not readable; the field is then simply omitted. */
  private readonly employeeNames = toSignal(this.officegest.employeeNames(), {
    initialValue: new Map<string, string>() as ReadonlyMap<string, string>,
  });

  protected readonly subtitle = computed(() => formatDateTime(this.store.data()?.startsAt));

  protected readonly lastUpdated = this.fetchedAt.asReadonly();

  /** Only when a plate was actually determined — most staff entries have none. */
  protected readonly plateLink = computed(() => this.store.data()?.plate ?? null);

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const appointment = this.store.data();

    if (!appointment) {
      return [];
    }

    // Declared in reading order, then filtered — so the order is obvious here
    // and the "omit what is absent" rule is applied once, at the end, rather
    // than as an `if` around each entry.
    const candidates: readonly (DetailField & { readonly value: string | null })[] = [
      { label: 'Assunto', value: orNull(appointment.title) },
      { label: 'Estado', value: formatStatus(appointment.status), badge: true },
      { label: 'Início', value: formatDateTime(appointment.startsAt) },
      { label: 'Fim', value: formatDateTime(appointment.endsAt) },
      { label: 'Duração', value: duration(appointment) },
      { label: 'Matrícula', value: formatPlate(appointment.plate) },
      { label: 'Responsável', value: this.employeeName(appointment) },
      { label: 'Local', value: orNull(appointment.location) },
      { label: 'Prioridade', value: formatPriority(appointment.priority) },
      { label: 'Cliente', value: orNull(appointment.customerId) },
      { label: 'Referência', value: appointment.id },
      { label: 'Notas', value: orNull(appointment.notes), wide: true },
    ];

    return candidates.filter((field) => field.value !== null);
  });

  private employeeName(appointment: Appointment): string | null {
    const id = appointment.employeeId;

    if (!id) {
      return null;
    }

    // The id is a poor label, but it is better than dropping the fact that the
    // booking is assigned to somebody when the roster could not be read.
    return this.employeeNames().get(id) ?? `#${id}`;
  }
}

/**
 * How long the booking runs, in the units a person would say it in.
 *
 * Computed rather than stored: the two instants are the facts, and a reader
 * comparing "03/08, 08:30" with "17/08, 09:00" to work out "14 dias" is doing
 * arithmetic the page can do for them. Absent unless both ends are known and
 * the range makes sense.
 */
function duration(appointment: Appointment): string | null {
  if (!appointment.startsAt || !appointment.endsAt) {
    return null;
  }

  const start = Date.parse(appointment.startsAt);
  const end = Date.parse(appointment.endsAt);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null;
  }

  const minutes = Math.round((end - start) / 60_000);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;

  if (hours < 24) {
    // One decimal only when it says something: "2 h" reads better than "2,0 h".
    const rendered = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace('.', ',');
    return `${rendered} h`;
  }

  const days = Math.round(hours / 24);

  return days === 1 ? '1 dia' : `${days} dias`;
}
