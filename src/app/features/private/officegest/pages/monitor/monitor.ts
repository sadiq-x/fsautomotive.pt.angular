import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, interval, map, of, scan, startWith, switchMap } from 'rxjs';

import { PRIVATE_ROUTES } from '../../../../../core/config/private-routes.config';
import { ApiError } from '../../../../../core/models/api.model';
import { Icon } from '../../../../../shared/components/icon/icon';
import { UiButton } from '../../../../../shared/components/ui-button/ui-button';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { StatePanel, type PanelState } from '../../components/state-panel/state-panel';
import type { MonitorBoard, MonitorServiceOrder } from '../../models';
import type { MechanicCar, MechanicOnDuty } from './mechanic-on-duty';
import { toMechanicsOnDuty } from './mechanic-on-duty';
import { OfficeGestService } from '../../services/officegest.service';
import { formatDateTime, formatMileage, formatPlate } from '../../utils/format';
import { ElapsedTime } from './elapsed-time';

/**
 * The live workshop board — which cars are in, and who is on them.
 *
 * WHY THIS POLLS INSTEAD OF SUBSCRIBING
 * -------------------------------------
 * There is nothing to subscribe to. OfficeGest publishes no webhook and no
 * event stream — its documented `Queue master` category does not exist on this
 * tenant — so the data can only be pulled. The backend does the pulling and
 * caches the result for ten seconds, which is what stops six open tablets from
 * becoming six times the upstream load; this page polls that cache.
 *
 * WHY TWENTY SECONDS
 * ------------------
 * Slower than the backend's cache, so a poll usually costs nothing upstream,
 * and fast enough that a car moving between states is noticed within the time
 * it takes to walk across the workshop. The timers on screen tick every second
 * regardless — see `ElapsedTime` — so the board never *looks* frozen between
 * polls even though it is only refetched three times a minute.
 *
 * WHY A FAILED POLL DOES NOT CLEAR THE SCREEN
 * -------------------------------------------
 * A board that blanks itself the moment the network hiccups is worse than one
 * showing data from a minute ago, because the mechanic cannot tell the
 * difference between "no cars" and "no connection". The last good board stays
 * on screen and `LastUpdated` turns amber and then red as it ages. The state
 * survives the error rather than being replaced by it.
 */

/** How often the board is refetched. See the note above on why this number. */
const POLL_MS = 20_000;

type BoardStatus = 'loading' | 'ready' | 'error';

interface BoardState {
  readonly status: BoardStatus;
  /** A request is in flight. Drives the refresh control's spinner. */
  readonly loading: boolean;
  /** The last board that arrived, kept across a failed poll. */
  readonly board: MonitorBoard | null;
  /** `Date.now()` when that board arrived — `ElapsedTime`'s clock bridge. */
  readonly receivedAt: number;
  /** When it arrived, for the freshness indicator. */
  readonly lastSuccessAt: Date | null;
  /** Set while the most recent attempt failed; cleared by the next success. */
  readonly error: string | null;
}

const INITIAL: BoardState = {
  status: 'loading',
  loading: true,
  board: null,
  receivedAt: Date.now(),
  lastSuccessAt: null,
  error: null,
};

@Component({
  selector: 'app-monitor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ElapsedTime, Icon, LastUpdated, RouterLink, StatePanel, UiButton],
  templateUrl: './monitor.html',
})
export class Monitor {
  private readonly officegest = inject(OfficeGestService);

  /** Bumped to force an immediate refetch without waiting for the next tick. */
  private readonly retries = signal(0);

  private readonly state = toSignal(
    // A retry restarts the polling interval rather than firing a request
    // alongside it. Without the outer `switchMap` the two would run on their
    // own schedules, and an impatient user pressing the button three times
    // would leave three intervals polling for as long as the page stayed open.
    toObservable(this.retries).pipe(
      switchMap(() => interval(POLL_MS).pipe(startWith(0))),
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
          // Emitted before the request resolves, so the control starts turning
          // the moment the poll leaves rather than only once it lands.
          startWith({ loading: true } as const),
        ),
      ),
      scan((previous: BoardState, result): BoardState => {
        if ('loading' in result) {
          // Nothing on screen changes yet — this only starts the spinner.
          return { ...previous, loading: true };
        }

        if ('error' in result) {
          // Everything already on screen is kept. Only the error is new.
          return { ...previous, status: 'error', error: result.error, loading: false };
        }

        return {
          status: 'ready',
          loading: false,
          board: result.board,
          receivedAt: result.receivedAt,
          lastSuccessAt: new Date(result.receivedAt),
          error: null,
        };
      }, INITIAL),
    ),
    { initialValue: INITIAL },
  );

  protected readonly board = computed(() => this.state().board);
  protected readonly loading = computed(() => this.state().loading);
  protected readonly error = computed(() => this.state().error);
  protected readonly receivedAt = computed(() => this.state().receivedAt);
  protected readonly lastSuccessAt = computed(() => this.state().lastSuccessAt);

  protected readonly cards = computed<readonly MonitorServiceOrder[]>(
    () => this.board()?.serviceOrders ?? [],
  );

  /**
   * What the empty state should say, which is not always "there is nothing".
   *
   * Three different situations render as an empty-ish board and a mechanic
   * cannot tell them apart without being told:
   *
   *  - nothing has loaded yet;
   *  - the board loaded and the workshop genuinely has no active jobs;
   *  - the board is full of cars and not one of them has anybody clocked on,
   *    which is this tenant's actual situation and is a *process* gap, not a
   *    fault. Saying so is the difference between a screen that looks broken
   *    and one that explains itself.
   */
  protected readonly panel = computed<PanelState | null>(() => {
    const state = this.state();

    // A board that has arrived wins, even if a later poll then failed: showing
    // yesterday's cars beats showing an error where the cars were.
    if (state.board) {
      return state.board.serviceOrders.length === 0 ? 'empty' : null;
    }

    return state.status === 'error' ? 'error' : 'loading';
  });

  /** True when cars are on the board but nobody is recorded as working. */
  protected readonly nobodyClockedOn = computed(() => {
    const board = this.board();
    return board !== null && board.serviceOrders.length > 0 && board.activeMechanicCount === 0;
  });

  protected readonly activeCount = computed(() => this.board()?.activeMechanicCount ?? 0);

  /**
   * Every mechanic, and the car each one is at — the board read the other way
   * round.
   *
   * The cards answer "who is on this car"; a foreman walking in wants "where is
   * João". Both come from the same payload, so the second view costs one
   * derivation rather than a second request.
   */
  protected readonly mechanics = computed<readonly MechanicOnDuty[]>(() => {
    const board = this.board();

    return board ? toMechanicsOnDuty(board) : [];
  });

  /** Hidden entirely when there is nobody to list, rather than shown empty. */
  protected readonly hasMechanics = computed(() => this.mechanics().length > 0);

  protected readonly observedAt = computed(() => this.board()?.observedAt ?? '');

  protected retry(): void {
    this.retries.update((value) => value + 1);
  }

  /* ------------------------------------------------------------------ */
  /* Presentation helpers — the template stays declarative               */
  /* ------------------------------------------------------------------ */

  protected plate(card: MonitorServiceOrder): string | null {
    return formatPlate(card.plate);
  }

  /**
   * Where a card leads: that job's own page.
   *
   * The board's card id is the work order's `number`, which is exactly what
   * `/workshop/service-orders/{id}` is keyed on — CONFIRMED 2026-09-13 by
   * resolving eight live board cards against the detail endpoint, all eight of
   * which came back with a matching plate. So the card can link straight to the
   * existing page rather than needing one of its own.
   */
  protected orderLink(card: MonitorServiceOrder): string {
    return PRIVATE_ROUTES.serviceOrder(card.id);
  }

  /** Where a mechanic row leads: that mechanic's own page. */
  protected mechanicLink(mechanic: MechanicOnDuty): string {
    return PRIVATE_ROUTES.mechanic(mechanic.employeeCode);
  }

  /** The plate if upstream sent one, otherwise the job number. Never blank. */
  protected carLabel(car: MechanicCar): string {
    return formatPlate(car.plate) ?? car.serviceOrderId;
  }

  protected vehicleLine(card: MonitorServiceOrder): string | null {
    const vehicle = card.vehicle;

    if (!vehicle) {
      return null;
    }

    // Whatever upstream actually sent, in the order someone says it aloud.
    const parts = [vehicle.brand, vehicle.model, vehicle.version].filter(
      (part): part is string => !!part,
    );

    return parts.length > 0 ? parts.join(' ') : (vehicle.description ?? null);
  }

  protected mileage(card: MonitorServiceOrder): string | null {
    return formatMileage(card.vehicle?.mileage);
  }

  protected estimate(card: MonitorServiceOrder): string | null {
    return formatDateTime(card.estimatedCompletionAt);
  }

  /** Completion as a whole-number percentage for the progress bar. */
  protected progress(card: MonitorServiceOrder): number | null {
    const fraction = card.completionPercentage;
    return fraction === undefined ? null : Math.round(fraction * 100);
  }

  protected completedCount(card: MonitorServiceOrder): number {
    return card.interventions.filter((intervention) => intervention.completed).length;
  }

  protected readonly cardKey = (_index: number, card: MonitorServiceOrder): string => card.id;
}
