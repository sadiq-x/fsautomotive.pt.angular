import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../../core/auth';
import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';
import type { TableColumn } from '../../components/data-table/data-table.model';
import { ResourcePage } from '../../components/resource-page/resource-page';
import type { Appointment } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { createResourceList } from '../../services/resource-list.store';
import { formatDateTime, formatPlate, orNull } from '../../utils/format';

interface AppointmentFilters {
  readonly from?: string;
  readonly to?: string;
}

/**
 * Bookings, with a server-side date range.
 *
 * The "Nova marcação" action is hidden without the write permission. That is a
 * courtesy — the route guard checks it too, and the backend decides for real —
 * but showing a button that leads to a rejection is a poor experience.
 */
@Component({
  selector: 'app-appointments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ResourcePage, UiButton],
  template: `
    <app-resource-page
      title="Marcações"
      subtitle="Agenda da oficina no OfficeGest."
      caption="Lista de marcações"
      [store]="store"
      [columns]="columns"
      [rowKey]="rowKey"
      [rowLink]="rowLink"
      [rowLabel]="rowLabel"
    >
      @if (canCreate()) {
        <app-button
          slot="actions"
          icon="plus"
          iconPosition="left"
          [routerLink]="routes.newAppointment"
        >
          Nova marcação
        </app-button>
      }

      <div slot="filters" class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span>De</span>
          <input
            type="date"
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="dateValue(store.filters().from)"
            (ngModelChange)="store.setFilters({ from: toStartOfDay($event) })"
          />
        </label>

        <label class="flex items-center gap-2 text-meta text-ink-500">
          <span>Até</span>
          <input
            type="date"
            class="rounded-full border-0 bg-white px-4 py-2 text-body text-ink-900 shadow-btn ring-1 ring-ink-950/8 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
            [ngModel]="dateValue(store.filters().to)"
            (ngModelChange)="store.setFilters({ to: toEndOfDay($event) })"
          />
        </label>
      </div>
    </app-resource-page>
  `,
})
export class Appointments {
  private readonly officegest = inject(OfficeGestService);
  private readonly auth = inject(AuthService);

  protected readonly routes = PRIVATE_ROUTES;

  protected readonly store = createResourceList<Appointment, AppointmentFilters>({
    fetch: (query) => this.officegest.listAppointments(query),
    initialFilters: {},
  });

  protected readonly rowKey = (appointment: Appointment): string => appointment.id;
  protected readonly rowLink = (appointment: Appointment): string =>
    PRIVATE_ROUTES.appointment(appointment.id);
  protected readonly rowLabel = (appointment: Appointment): string =>
    `Ver marcação ${appointment.title ?? appointment.id}`;

  protected canCreate(): boolean {
    return this.auth.hasPermission('officegest.appointments.write');
  }

  protected readonly columns: readonly TableColumn<Appointment>[] = [
    {
      key: 'title',
      header: 'Assunto',
      value: (appointment) => orNull(appointment.title),
      sortValue: (appointment) => appointment.title ?? null,
      priority: 'primary',
    },
    {
      key: 'startsAt',
      header: 'Início',
      value: (appointment) => formatDateTime(appointment.startsAt),
      sortValue: (appointment) => appointment.startsAt ?? null,
      priority: 'secondary',
    },
    {
      key: 'endsAt',
      header: 'Fim',
      value: (appointment) => formatDateTime(appointment.endsAt),
      sortValue: (appointment) => appointment.endsAt ?? null,
    },
    {
      key: 'plate',
      header: 'Matrícula',
      value: (appointment) => formatPlate(appointment.plate),
      sortValue: (appointment) => appointment.plate ?? null,
    },
    {
      key: 'status',
      header: 'Estado',
      value: (appointment) => orNull(appointment.status),
      badge: true,
      align: 'end',
    },
  ];

  /** ISO instant → the `yyyy-MM-dd` an `<input type="date">` expects. */
  protected dateValue(iso: string | undefined): string {
    return iso ? (iso.slice(0, 10) ?? '') : '';
  }

  /**
   * A date input gives a day; the backend wants an instant. The day is widened
   * to its full local span so "de 1 até 1 de setembro" includes that whole day
   * rather than only midnight.
   */
  protected toStartOfDay(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  protected toEndOfDay(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
}
