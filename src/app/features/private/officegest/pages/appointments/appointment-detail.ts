import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { DetailList, type DetailField } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceDetail } from '../../services/resource-detail.store';
import { formatDateTime, formatPlate, orNull } from '../../utils/format';

/** One booking. */
@Component({
  selector: 'app-appointment-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage],
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
        <h2 class="text-h3 text-ink-900">Dados da marcação</h2>
        <app-detail-list class="mt-5" [fields]="fields()" />
      </section>
    </app-detail-page>
  `,
})
export class AppointmentDetail {
  /** Bound from the `:appointmentId` route parameter. */
  readonly appointmentId = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly routes = PRIVATE_ROUTES;

  protected readonly store = createResourceDetail({
    id: this.appointmentId,
    fetch: (id) => this.officegest.getAppointment(id),
  });

  protected readonly subtitle = computed(() => formatDateTime(this.store.data()?.startsAt));

  protected readonly fields = computed<readonly DetailField[]>(() => {
    const appointment = this.store.data();

    if (!appointment) {
      return [];
    }

    return [
      { label: 'Assunto', value: orNull(appointment.title) },
      { label: 'Estado', value: orNull(appointment.status), badge: true },
      { label: 'Início', value: formatDateTime(appointment.startsAt) },
      { label: 'Fim', value: formatDateTime(appointment.endsAt) },
      { label: 'Matrícula', value: formatPlate(appointment.plate) },
      { label: 'Cliente', value: orNull(appointment.customerId) },
      { label: 'Notas', value: orNull(appointment.notes), wide: true },
    ];
  });
}
