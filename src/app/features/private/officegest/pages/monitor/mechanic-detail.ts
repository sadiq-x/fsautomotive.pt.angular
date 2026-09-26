import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, interval, map, of, scan, startWith, switchMap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { ApiError } from '../../../../../core/models/api.model';
import type { DetailField } from '../../components/detail-list/detail-list';
import { DetailList } from '../../components/detail-list/detail-list';
import { DetailPage } from '../../components/detail-page/detail-page';
import type { DetailStatus } from '../../services/resource-detail.store';
import type { Employee, MonitorBoard, ServiceOrderTimeEntry } from '../../models';
import { OfficeGestService } from '../../services/officegest.service';
import { formatMinutes } from '../../utils/elapsed';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMileage,
  formatPlate,
  orNull,
} from '../../utils/format';
import { ElapsedTime } from './elapsed-time';
import type { MechanicCar, MechanicOnDuty } from './mechanic-on-duty';
import { toMechanicsOnDuty } from './mechanic-on-duty';

/**
 * One mechanic: who they are, which car they are at, and for how long.
 *
 * WHY THIS POLLS THE BOARD RATHER THAN A MECHANIC ENDPOINT
 * --------------------------------------------------------
 * There is no mechanic endpoint to poll. OfficeGest publishes a clock-on only
 * as part of a monitor row, so "what is João doing" is a question about the
 * board — and the board is already the one request the backend caches for every
 * screen in the workshop. Adding a per-mechanic endpoint would mean a second
 * upstream shape carrying the same facts, and the two could disagree by however
 * long apart they were fetched.
 *
 * So this page reads the same cached board, on the same interval, and picks out
 * the one mechanic. Opening it costs nothing the board was not already paying.
 *
 * WHY THE CONTACT DETAILS COME FROM A SECOND CALL
 * -----------------------------------------------
 * They are guarded by `workers.read`, and this page is guarded by
 * `officegest.service-orders.read`. Folding the staff list into the board
 * response would hand a mechanic's e-mail to anyone allowed to watch the
 * board — so it stays a separate, separately-guarded request that resolves to
 * nothing when refused. The page then simply has fewer rows.
 */

/** The same cadence as the board; see `Monitor` for why twenty seconds. */
const POLL_MS = 20_000;

/**
 * How many assigned jobs are fetched.
 *
 * More than the table shows, because the same response answers a second
 * question: which of this mechanic's jobs are on the live board right now. The
 * busiest mechanic here has 76, so one page covers the roster; the backend
 * sweeps the same window whatever size is asked for, so this costs nothing
 * extra upstream.
 */
const HISTORY_FETCH_SIZE = 100;

/** How many of them the table lists. The rest are a click away, filtered alike. */
const HISTORY_ROWS = 10;

/** What one poll produced. The board is kept across a later failure. */
interface PollState {
  readonly board: MonitorBoard | null;
  /** `Date.now()` when that board arrived — `ElapsedTime`'s clock bridge. */
  readonly receivedAt: number;
  /** Set while the most recent attempt failed; cleared by the next success. */
  readonly error: string | null;
}

const INITIAL: PollState = { board: null, receivedAt: Date.now(), error: null };

@Component({
  selector: 'app-mechanic-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailList, DetailPage, ElapsedTime, RouterLink],
  templateUrl: './mechanic-detail.html',
})
export class MechanicDetail {
  /** Bound from the route, so the page is addressable and shareable. */
  readonly employeeCode = input.required<string>();

  private readonly officegest = inject(OfficeGestService);

  protected readonly backLink = PRIVATE_ROUTES.monitor;

  /**
   * The board, polled.
   *
   * Note what this stream does *not* do: read `employeeCode`. `toSignal`
   * subscribes while the component is being constructed, which is before
   * Angular has set a required input — reading it here throws NG0950, and
   * would do so in production the moment a response arrived synchronously.
   * *Which* mechanic the page is about is a question for `computed` below,
   * where the input is read when it is used rather than when the pipeline was
   * built.
   */
  private readonly poll = toSignal(
    interval(POLL_MS).pipe(
      startWith(0),
      switchMap(() =>
        this.officegest.getWorkshopBoard().pipe(
          map((board) => ({ board, receivedAt: Date.now() }) as const),
          catchError((error: unknown) =>
            of({
              error:
                error instanceof ApiError
                  ? error.message
                  : 'Não foi possível contactar o servidor.',
            } as const),
          ),
        ),
      ),
      scan((previous: PollState, result): PollState => {
        // A failed poll keeps the car and its timer on screen; only the
        // warning is new. Same rule as the board itself.
        if ('error' in result) {
          return { ...previous, error: result.error };
        }

        return { board: result.board, receivedAt: result.receivedAt, error: null };
      }, INITIAL),
    ),
    { initialValue: INITIAL },
  );

  /**
   * The staff list, which this page may not be allowed to read.
   *
   * Guarded by `workers.read`, while the page itself is guarded by
   * `officegest.service-orders.read`. The service resolves a refusal to an
   * empty map, so being denied costs the contact rows and nothing else.
   */
  private readonly employees = toSignal(this.officegest.employeesById(), {
    initialValue: new Map<string, Employee>() as ReadonlyMap<string, Employee>,
  });

  /**
   * The jobs assigned to this mechanic.
   *
   * WHAT THIS IS, AND WHAT IT IS NOT
   * --------------------------------
   * It is every work order carrying this person's `mechanic_id` — an
   * *assignment*, filled in on only 69 of 1 000 jobs. It is not the same claim
   * as "this mechanic worked this job": that now has a real answer, from
   * `/workshop/service-orders/{id}/times`, and `workedTimes` below enriches
   * these same rows with it rather than replacing this list. An order this
   * mechanic actually clocked time on but was never *assigned* to will not
   * appear here at all — see `workedTimes` for why that gap is accepted rather
   * than closed.
   *
   * Fetched once per mechanic rather than polled: an assignment made this
   * second is not the kind of fact a page needs to discover within twenty.
   */
  private readonly history = toSignal(
    toObservable(this.employeeCode).pipe(
      switchMap((employeeCode) =>
        this.officegest
          .listServiceOrders({ page: 1, perPage: HISTORY_FETCH_SIZE, mechanicId: employeeCode })
          .pipe(
            map((paged) => ({ orders: paged.items, total: paged.pagination.total, failed: false })),
            catchError(() => of({ orders: [], total: undefined, failed: true } as const)),
            startWith({ orders: [], total: undefined, failed: false } as const),
          ),
      ),
    ),
    { initialValue: { orders: [], total: undefined, failed: false } as const },
  );

  protected readonly historyOrders = computed(() => this.history().orders);
  protected readonly historyTotal = computed(() => this.history().total);
  protected readonly historyFailed = computed(() => this.history().failed);

  /** Rows for the table, pre-formatted so the template does no work. */
  protected readonly historyRows = computed(() =>
    this.historyOrders()
      .slice(0, HISTORY_ROWS)
      .map((order) => ({
        id: order.id,
        link: PRIVATE_ROUTES.serviceOrder(order.id),
        number: order.number ?? order.id,
        plate: formatPlate(order.plate) ?? '—',
        opened: formatDate(order.openedAt) ?? '—',
        status: order.status ?? '—',
        // ⚠️ KNOWN WRONG on at least some orders, same as the list page's
        // "Total" column — `order.total` can match a single line's gross
        // rather than the job's real cost (confirmed 6.03 vs a real 409.54 on
        // order 202600642). Not fixed here: `listServiceOrders` is a list
        // fetch, which carries no line items to sum a real total from — see
        // `service-order-detail.ts`'s `lineTotals` for where that fix lives.
        total: formatCurrency(order.total) ?? '—',
      })),
  );

  /**
   * This mechanic's own logged minutes, per row actually shown on screen.
   *
   * WHY THIS IS BOUNDED TO THE TEN VISIBLE ROWS, NOT THE HUNDRED FETCHED
   * ----------------------------------------------------------------------
   * There is no "give me every order this mechanic worked" endpoint — the only
   * way to know is to ask each order's own `/times` log, one request per order.
   * Doing that for the full `HISTORY_FETCH_SIZE` of 100 assigned jobs on every
   * page view would cost 100 upstream requests for a table that shows ten of
   * them. Asking it only for what is on screen keeps the cost proportional to
   * what the page actually renders.
   *
   * This also means it can only ever enrich an *assigned* row, never surface a
   * job this mechanic clocked time on without being the assigned mechanic —
   * the accepted gap `historyOrders` documents.
   */
  private readonly workedTimes = toSignal(
    toObservable(this.historyRows).pipe(
      switchMap((rows) => {
        if (rows.length === 0) {
          return of(new Map<string, number>());
        }

        return forkJoin(
          rows.map((row) =>
            this.officegest
              .getServiceOrderTimes(row.id)
              .pipe(catchError(() => of([] as readonly ServiceOrderTimeEntry[]))),
          ),
        ).pipe(
          map((entriesByRow) => {
            const code = this.employeeCode();
            const byOrder = new Map<string, number>();

            rows.forEach((row, index) => {
              const minutes = (entriesByRow[index] ?? [])
                .filter((entry) => entry.employeeId === code)
                .map((entry) => entry.workedMinutes)
                .filter((value): value is number => value !== undefined);

              // Only closed sessions carry worked minutes. A mechanic whose only
              // entry here is still open has no total yet — a dash, not "0 min".
              if (minutes.length > 0) {
                byOrder.set(
                  row.id,
                  minutes.reduce((a, b) => a + b, 0),
                );
              }
            });

            return byOrder;
          }),
        );
      }),
    ),
    { initialValue: new Map<string, number>() },
  );

  /** This mechanic's logged time on one row, formatted — `null` when there is none. */
  protected loggedTimeFor(rowId: string): string | null {
    const minutes = this.workedTimes().get(rowId);

    return minutes === undefined ? null : formatMinutes(minutes);
  }

  /**
   * The jobs assigned to this mechanic that are open on the board right now.
   *
   * WHY THIS EXISTS SEPARATELY FROM `mechanic.cars`
   * -----------------------------------------------
   * Those are clock-ons: OfficeGest put this person at that car and recorded
   * when. This is assignment: `mechanic_id` on the work order. They are
   * different fields with different meanings, and on this tenant only one of
   * them is ever filled in — 86 assignments against 0 clock-ons.
   *
   * Linking work by clock-on alone therefore made every mechanic's page empty
   * even when the board plainly showed their car with a list of jobs to do. A
   * page that says "sem trabalho" about a mechanic with an open car is wrong,
   * whatever field it consulted.
   *
   * Anything already covered by a clock-on is excluded, so a car never appears
   * twice on the same page.
   */
  protected readonly assignedActive = computed(() => {
    const board = this.poll().board;

    if (!board) {
      return [];
    }

    const clockedOn = new Set((this.mechanic()?.cars ?? []).map((car) => car.serviceOrderId));
    const assigned = new Set(this.historyOrders().map((order) => order.id));

    return board.serviceOrders.filter((row) => assigned.has(row.id) && !clockedOn.has(row.id));
  });

  /** Work of either kind — a clock-on or an open assignment. */
  protected readonly hasWork = computed(
    () => this.cars().length > 0 || this.assignedActive().length > 0,
  );

  protected completedCount(order: { interventions: readonly { completed: boolean }[] }): number {
    return order.interventions.filter((intervention) => intervention.completed).length;
  }

  protected progressOf(order: { completionPercentage?: number }): number | null {
    return order.completionPercentage === undefined
      ? null
      : Math.round(order.completionPercentage * 100);
  }

  protected plateOf(order: { plate?: string; id: string }): string {
    return formatPlate(order.plate) ?? order.id;
  }

  protected orderLinkFor(id: string): string {
    return PRIVATE_ROUTES.serviceOrder(id);
  }

  protected readonly receivedAt = computed(() => this.poll().receivedAt);
  protected readonly observedAt = computed(() => this.poll().board?.observedAt ?? '');
  protected readonly errorMessage = computed(() => this.poll().error);

  protected readonly mechanic = computed<MechanicOnDuty | null>(() => {
    const board = this.poll().board;

    if (!board) {
      return null;
    }

    const code = this.employeeCode();

    return toMechanicsOnDuty(board).find((entry) => entry.employeeCode === code) ?? null;
  });

  protected readonly status = computed<DetailStatus>(() => {
    const { board, error } = this.poll();

    // Only an error when there is nothing to show: a board already on screen
    // outlives a failed refresh.
    if (!board) {
      return error ? 'error' : 'loading';
    }

    // A code matching nobody is a bad URL, not a fault — "missing" says so,
    // where "error" would blame the network.
    return this.mechanic() ? 'ready' : 'missing';
  });

  protected readonly title = computed(() => this.mechanic()?.name ?? this.employeeCode());

  protected readonly cars = computed<readonly MechanicCar[]>(() => this.mechanic()?.cars ?? []);

  protected readonly isWorking = computed(() => this.cars().length > 0);

  /**
   * Who this person is.
   *
   * The department comes from the board's roster and the rest from the staff
   * list, which is why the list shortens rather than breaks when that request
   * is refused.
   */
  protected readonly identity = computed<readonly DetailField[]>(() => {
    const employee = this.employees().get(this.employeeCode()) ?? null;
    const department = this.departmentOf();

    const fields: DetailField[] = [
      { label: 'Nome', value: this.title() },
      { label: 'Código', value: this.employeeCode() },
      { label: 'Departamento', value: department },
    ];

    if (employee) {
      fields.push(
        { label: 'E-mail', value: orNull(employee.email), href: mailto(employee.email) },
        { label: 'Telefone', value: orNull(employee.phone), href: tel(employee.phone) },
        { label: 'Utilizador', value: orNull(employee.login) },
        { label: 'Desde', value: formatDate(employee.since) },
        {
          label: 'Estado',
          value: employee.active === undefined ? null : employee.active ? 'Ativo' : 'Inativo',
          badge: true,
        },
      );
    }

    return fields;
  });

  /** The car's own facts, beside the timer rather than inside it. */
  protected carFields(car: MechanicCar): readonly DetailField[] {
    const order = this.orderFor(car);

    return [
      { label: 'Matrícula', value: formatPlate(car.plate) },
      { label: 'Viatura', value: orNull(car.vehicle) },
      { label: 'Cliente', value: orNull(order?.customerName) },
      { label: 'Folha de obra', value: orNull(order?.documentNumber ?? order?.id) },
      { label: 'Estado', value: orNull(order?.status), badge: true },
      { label: 'Quilómetros', value: formatMileage(order?.vehicle?.mileage) },
      {
        label: 'Ano',
        value: order?.vehicle?.manufacturingYear ? String(order.vehicle.manufacturingYear) : null,
      },
      { label: 'Combustível', value: orNull(order?.vehicle?.fuel) },
      { label: 'Aberta em', value: formatDate(order?.openedAt) },
      { label: 'Conclusão estimada', value: formatDateTime(order?.estimatedCompletionAt) },
      { label: 'Entrega prevista', value: formatDateTime(order?.expectedDeliveryAt) },
      { label: 'Início do trabalho', value: formatDateTime(car.startedAt) },
    ];
  }

  /** The full record behind a card, for the fields the summary does not carry. */
  protected orderFor(car: MechanicCar) {
    return this.poll().board?.serviceOrders.find((order) => order.id === car.serviceOrderId);
  }

  protected interventionsFor(car: MechanicCar) {
    return this.orderFor(car)?.interventions ?? [];
  }

  protected completedFor(car: MechanicCar): number {
    return this.interventionsFor(car).filter((intervention) => intervention.completed).length;
  }

  /** Progress as a whole-number percentage, or `null` when upstream sent none. */
  protected progressFor(car: MechanicCar): number | null {
    const fraction = this.orderFor(car)?.completionPercentage;

    return fraction === undefined ? null : Math.round(fraction * 100);
  }

  protected awaitingPartsFor(car: MechanicCar): boolean {
    return this.orderFor(car)?.awaitingParts === true;
  }

  /** The plate if upstream sent one, otherwise the job number. Never blank. */
  protected carLabelOf(car: MechanicCar): string {
    return formatPlate(car.plate) ?? car.serviceOrderId;
  }

  /** Deep link to the work order, where the billed lines and notes live. */
  protected orderLink(car: MechanicCar): string {
    return PRIVATE_ROUTES.serviceOrder(car.serviceOrderId);
  }

  private departmentOf(): string | null {
    const code = this.employeeCode();
    const entry = this.poll().board?.roster.find((row) => row.employeeCode === code);

    return orNull(entry?.department) ?? orNull(entry?.departmentId);
  }
}

function mailto(email: string | undefined): string | undefined {
  return email ? `mailto:${email}` : undefined;
}

function tel(phone: string | undefined): string | undefined {
  return phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined;
}
