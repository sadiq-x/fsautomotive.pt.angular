import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, type Observable } from 'rxjs';

import { AuthService } from '../../../../../core/auth';
import type { IconName, Paged } from '../../../../../core/models';
import { Icon } from '../../../../../shared/components/icon/icon';
import { PRIVATE_NAV, type PrivateNavItem } from '../../../layout/private-nav.data';
import { OfficeGestService } from '../../services/officegest.service';

/** A headline number, or the reason there isn't one. */
interface Metric {
  readonly value: number | null;
  readonly loading: boolean;
  readonly failed: boolean;
}

const PENDING: Metric = { value: null, loading: true, failed: false };

/**
 * The landing page of the private area.
 *
 * WHERE THE NUMBERS COME FROM
 * ---------------------------
 * There is no statistics endpoint, and inventing one would mean inventing a
 * backend. Instead each tile asks an existing list endpoint for a single row
 * and reads `meta.total` — one cheap request per tile, using only what the API
 * genuinely provides.
 *
 * That total is not always there: OfficeGest omits it on some endpoints (see
 * `server/README.md` §8). A tile with no total shows a dash rather than a zero,
 * because "we could not count this" and "there are none" are different
 * statements and only one of them is alarming.
 *
 * Each tile fails independently. One endpoint being down leaves the other
 * numbers and the whole navigation working.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly officegest = inject(OfficeGestService);
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;

  /** Everything except the dashboard itself, filtered by permission. */
  protected readonly shortcuts = computed<readonly PrivateNavItem[]>(() => {
    this.auth.user();

    return PRIVATE_NAV.filter(
      (item) => !item.exact && (!item.permission || this.auth.hasPermission(item.permission)),
    );
  });

  protected readonly customers = this.metric(() =>
    this.officegest.listCustomers({ page: 1, perPage: 1 }),
  );

  protected readonly vehicles = this.metric(() =>
    this.officegest.listVehicles({ page: 1, perPage: 1 }),
  );

  protected readonly appointments = this.metric(() =>
    this.officegest.listAppointments({
      page: 1,
      perPage: 1,
      // From now on: the useful count is what is still to come, not the archive.
      from: new Date().toISOString(),
    }),
  );

  /** Typed here rather than in the template, so `IconName` survives. */
  protected readonly tiles = computed<readonly { label: string; icon: IconName; metric: Metric }[]>(
    () => [
      { label: 'Clientes', icon: 'users', metric: this.customers() },
      { label: 'Veículos', icon: 'car', metric: this.vehicles() },
      { label: 'Marcações futuras', icon: 'calendar', metric: this.appointments() },
    ],
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.user()?.name.split(' ')[0] ?? '';
    const salutation = hour < 12 ? 'Bom dia' : hour < 20 ? 'Boa tarde' : 'Boa noite';

    return name ? `${salutation}, ${name}` : salutation;
  });

  /** Turns any list request into a tile state, without ever throwing. */
  private metric<T>(request: () => Observable<Paged<T>>) {
    return toSignal(
      request().pipe(
        map((page): Metric => ({
          value: page.pagination.total ?? null,
          loading: false,
          failed: false,
        })),
        catchError(() => of<Metric>({ value: null, loading: false, failed: true })),
        startWith(PENDING),
      ),
      { initialValue: PENDING },
    );
  }
}
