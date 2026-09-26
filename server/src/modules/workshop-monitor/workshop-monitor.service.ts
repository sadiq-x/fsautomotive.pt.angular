/**
 * Workshop-board use cases.
 *
 * WHY THIS POLLS INSTEAD OF PUSHING
 * ---------------------------------
 * A live board wants a push, and OfficeGest has nothing to push with: there is
 * no webhook, and the `Queue master` category that its documentation names does
 * not exist on this tenant — `/queue-master` and `/queue-master/events` both
 * 404. Whatever this service does, it ends in polling upstream.
 *
 * What remains is *where* the polling happens, and the answer is here rather
 * than in the browser. Six mechanics with the board open is six clients; if each
 * polled OfficeGest the upstream load would scale with the number of screens in
 * the workshop. The TTL below collapses them into at most one upstream request
 * per `BOARD_TTL_MS`, however many browsers are watching — which is also what
 * keeps the API's own throttle (reported on every response, see
 * `logThrottleHeadroom`) from ever being the reason the board goes blank.
 *
 * WHY THE BOARD IS CURRENTLY EMPTY OF MECHANICS
 * ---------------------------------------------
 * It is not a bug in this file, so it is written down here rather than
 * rediscovered. Across 1 200 monitor rows on 2026-09-13 the `mechanics` array
 * was empty on every one, no intervention had ever been marked `completed`, and
 * no job has ever reached the `EXE` ("Em Execução") state — 28 of the 29 active
 * jobs sit in `ESP`. Five mechanics are registered under `/workshop/mechanics`
 * and none is ever clocked onto a car.
 *
 * The fields are real, documented, and read correctly below. They fill in when
 * the workshop starts clocking on in the OG Oficinas Colaborador app. Until
 * then `activeMechanicCount` is zero, and the board is expected to say so
 * plainly instead of rendering an empty panel that looks broken.
 */
import type { WorkshopMonitorResource } from '../../integrations/officegest/index.js';
import type { Logger } from '../../shared/logger.js';
import { memoizeWithTtl, type TtlMemo } from '../../shared/ttl-memo.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import { formatPlate } from '../vehicles/plate.js';
import type { MonitorBoardQuery } from './workshop-monitor.dto.js';
import {
  toDepartmentNames,
  toInterventionEstimates,
  toMonitorRoster,
  toMonitorServiceOrder,
  toMonitorServiceOrders,
} from './workshop-monitor.mapper.js';
import type {
  MonitorBoard,
  MonitorRosterEntry,
  MonitorServiceOrder,
} from './workshop-monitor.model.js';

/**
 * How long a board snapshot is served before upstream is asked again.
 *
 * Ten seconds against a screen that refreshes every fifteen to thirty: short
 * enough that nobody sees a stale card, long enough that ten open tabs cost the
 * same upstream traffic as one.
 */
const BOARD_TTL_MS = 10_000;

/** One generous page. The tenant's active board is 29 rows; upstream caps at 250. */
const BOARD_PAGE_SIZE = 250;

/**
 * How long the mechanic roster is held.
 *
 * An hour, against the board's ten seconds, because they change at completely
 * different rates: the board is what is happening now, the roster is five
 * people who change perhaps twice a year. Refetching it every ten seconds
 * would triple this feature's upstream traffic to re-learn the same five names.
 */
const ROSTER_TTL_MS = 60 * 60 * 1000;

/** The roster is five records here; this is headroom, not an expectation. */
const ROSTER_PAGE_SIZE = 100;

/** The catalogue is 218 records, so one request at this size covers it. */
const CATALOGUE_PAGE_SIZE = 250;

/**
 * A stop on page-following.
 *
 * Two pages is 500 active jobs — an order of magnitude beyond anything this
 * workshop can have open at once. Reaching it means something upstream changed,
 * which is worth a warning rather than an unbounded loop on a request path.
 */
const MAX_BOARD_REQUESTS = 2;

/** Warn when fewer than this share of the throttle window is left. */
const THROTTLE_WARN_FRACTION = 0.1;

export class WorkshopMonitorService {
  /**
   * The unfiltered board, shared by every caller.
   *
   * Only this one is memoised. A filtered board is a person typing a plate into
   * a search box — rare, per-caller, and not what the wall screens poll — and
   * caching it would mean either a key per query string growing without bound,
   * or one caller's filter leaking into another's answer.
   */
  private readonly defaultBoard: TtlMemo<MonitorBoard>;

  /**
   * Everyone who could be at a car, cached far longer than the board.
   *
   * Shared by filtered and unfiltered requests alike: narrowing the board to
   * one plate does not change who works here.
   */
  private readonly roster: TtlMemo<readonly MonitorRosterEntry[]>;

  /**
   * Estimated minutes by intervention name, cached as long as the roster.
   *
   * A price list of 218 rows that changes when the workshop revises its rates —
   * which is to say, not during a shift.
   */
  private readonly estimates: TtlMemo<ReadonlyMap<string, number>>;

  constructor(
    private readonly monitor: WorkshopMonitorResource,
    private readonly log: Logger,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.defaultBoard = memoizeWithTtl(
      // No caller's logger or `AbortSignal` is bound here on purpose: the
      // result is shared, so one browser navigating away must not cancel the
      // fetch three other screens are waiting on. See `ttl-memo.ts`.
      () => this.fetchBoard({}, { logger: this.log }),
      BOARD_TTL_MS,
    );

    this.roster = memoizeWithTtl(() => this.fetchRoster(), ROSTER_TTL_MS);
    this.estimates = memoizeWithTtl(() => this.fetchEstimates(), ROSTER_TTL_MS);
  }

  /** The live board. Cached only when unfiltered. */
  async board(query: MonitorBoardQuery, context: UseCaseContext): Promise<MonitorBoard> {
    return isUnfiltered(query) ? this.defaultBoard.get() : this.fetchBoard(query, context);
  }

  private async fetchBoard(
    query: MonitorBoardQuery,
    context: UseCaseContext,
  ): Promise<MonitorBoard> {
    const collected: MonitorServiceOrder[] = [];

    // Started before the board so these overlap rather than queue. Both are
    // almost always cache hits and cost nothing; when they are not, there is no
    // reason for the board to wait on them in sequence.
    const roster = this.roster.get();
    const estimates = await this.estimates.get();

    for (let request = 1; request <= MAX_BOARD_REQUESTS; request += 1) {
      const result = await this.monitor.listActive(
        {
          page: request,
          perPage: BOARD_PAGE_SIZE,
          status: query.status,
          // Upstream matches the hyphenated form and returns nothing for a
          // normalised plate — the same trap `ServiceOrdersService` documents.
          plate: query.plate ? formatPlate(query.plate) : undefined,
          schedule: {
            startHour: query.startHour,
            endHour: query.endHour,
            lunchStart: query.lunchStart,
            lunchEnd: query.lunchEnd,
            skipWeekends: query.skipWeekends,
          },
        },
        { logger: context.logger, signal: context.signal },
      );

      collected.push(...toMonitorServiceOrders(result.items, estimates));
      this.logThrottleHeadroom(result.meta, context.logger);

      if (result.meta?.['has_more'] !== true || result.items.length === 0) {
        break;
      }

      if (request === MAX_BOARD_REQUESTS) {
        context.logger.warn('workshop board truncated at the request cap', {
          maxRequests: MAX_BOARD_REQUESTS,
          collected: collected.length,
        });
      }
    }

    const serviceOrders = collected.sort(byBoardOrder);

    return {
      serviceOrders,
      roster: await roster,
      observedAt: this.now().toISOString(),
      activeMechanicCount: serviceOrders.filter((order) => order.mechanics.length > 0).length,
    };
  }

  /**
   * One order's monitor record, in whatever state it is in, or `null`.
   *
   * WHY THIS EXISTS ALONGSIDE `board`
   * ---------------------------------
   * `board` only ever sees the active states (ESP/EXE/MAR): the moment an order
   * closes, `listActive` stops returning it and a work-order detail page has no
   * way left to show who clocked on to it. This reads the unfiltered monitor
   * path instead, narrowed to one job by number, so a closed order's mechanic
   * clock-on stays readable after the fact.
   *
   * Not memoised. Unlike the board, which every open tablet polls on the same
   * schedule, this is a single detail page asking about a single job — there is
   * no fan-out to collapse, and the order in question rarely changes twice in
   * one viewing.
   *
   * A failure — including "no such order" — resolves to `null` rather than
   * rejecting, the same trade `fetchRoster` makes: this data decorates a page
   * that works without it, so losing it must cost a garnish, not the screen.
   */
  async orderSnapshot(num: string, context: UseCaseContext): Promise<MonitorServiceOrder | null> {
    try {
      const [result, estimates] = await Promise.all([
        this.monitor.getByNumber(num, { logger: context.logger, signal: context.signal }),
        this.estimates.get(),
      ]);

      const [record] = result.items;

      return (record && toMonitorServiceOrder(record, estimates)) ?? null;
    } catch (error) {
      context.logger.warn('could not read the monitor record for one order', {
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  /**
   * The roster, or an empty one.
   *
   * A failure here is deliberately not propagated. The roster decorates the
   * board with who is free; the board itself — which cars are in, and who is at
   * them — does not depend on it. Taking the whole screen down because a
   * five-record lookup failed would trade the feature for one of its garnishes.
   *
   * `memoizeWithTtl` never caches a rejection, and this never rejects, so the
   * empty result *is* cached for the full hour. That is the intended trade: a
   * roster that briefly failed should not be retried on every poll from every
   * screen in the workshop. It is logged at `warn` so the cause is visible.
   */
  private async fetchRoster(): Promise<readonly MonitorRosterEntry[]> {
    try {
      // Requested together: they are independent tables and the roster is not
      // useful without the names behind its department ids.
      const [mechanics, departments] = await Promise.all([
        this.monitor.listMechanics(ROSTER_PAGE_SIZE, { logger: this.log }),
        this.fetchDepartmentNames(),
      ]);

      return toMonitorRoster(mechanics.items).map((entry) => {
        const department = entry.departmentId ? departments.get(entry.departmentId) : undefined;

        // Spread rather than always setting the key, so a mechanic with no
        // department has no `department` field at all instead of an explicit
        // `undefined` on the wire.
        return department ? { ...entry, department } : entry;
      });
    } catch (error) {
      this.log.warn('could not read the mechanic roster; the board will not show who is free', {
        error: error instanceof Error ? error.message : String(error),
      });

      return [];
    }
  }

  /**
   * Department names by id, or an empty map.
   *
   * Its own try/catch, and deliberately not part of the one above: losing the
   * departments costs a label beside a mechanic's name, while losing the
   * roster costs the whole "who is free" column. Letting a four-record lookup
   * take the roster down with it would be the tail wagging the dog.
   */
  /**
   * Estimated minutes by intervention name, or an empty map.
   *
   * Swallowed like the departments and for the same reason: an estimate beside
   * a job is a useful extra, and the board must not go dark because a price
   * list could not be read.
   */
  private async fetchEstimates(): Promise<ReadonlyMap<string, number>> {
    try {
      const result = await this.monitor.listInterventionCatalogue(CATALOGUE_PAGE_SIZE, {
        logger: this.log,
      });

      return toInterventionEstimates(result.items);
    } catch (error) {
      this.log.warn('could not read the intervention catalogue; jobs will show no estimate', {
        error: error instanceof Error ? error.message : String(error),
      });

      return new Map();
    }
  }

  private async fetchDepartmentNames(): Promise<ReadonlyMap<string, string>> {
    try {
      const result = await this.monitor.listDepartments(ROSTER_PAGE_SIZE, { logger: this.log });

      return toDepartmentNames(result.items);
    } catch (error) {
      this.log.warn('could not read the department table; mechanics will show no department', {
        error: error instanceof Error ? error.message : String(error),
      });

      return new Map();
    }
  }

  /**
   * Warns when the upstream throttle is nearly spent.
   *
   * OfficeGest reports the window on every response and this integration is
   * one of several things using the same tenant quota. Without this, the first
   * anyone would know of exhaustion is the board failing — and the cause would
   * look like an outage rather than a budget.
   */
  private logThrottleHeadroom(meta: Record<string, unknown> | undefined, logger: Logger): void {
    const remaining = readCount(meta?.['throttle_remaining']);
    const limit = readCount(meta?.['throttle_limit']);

    if (remaining === undefined || limit === undefined || limit <= 0) {
      return;
    }

    if (remaining / limit <= THROTTLE_WARN_FRACTION) {
      logger.warn('OfficeGest throttle window is nearly spent', {
        remaining,
        limit,
        monthlyRemaining: readCount(meta?.['monthly_remaining']),
      });
    }
  }
}

/** Whether the query asks for the shared board rather than a narrowed one. */
function isUnfiltered(query: MonitorBoardQuery): boolean {
  return Object.values(query).every((value) => value === undefined);
}

function readCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * The order the cards are read in.
 *
 * A board is scanned top-left first, so what is *happening* outranks what is
 * merely booked: jobs with someone stood at the car come first, then the ones
 * upstream marks most urgent, and jobs stalled waiting for parts sink — nobody
 * can act on those today. The id breaks ties so the cards do not swap places
 * between two polls of the same unchanged board.
 */
function byBoardOrder(a: MonitorServiceOrder, b: MonitorServiceOrder): number {
  return (
    b.mechanics.length - a.mechanics.length ||
    Number(a.awaitingParts ?? false) - Number(b.awaitingParts ?? false) ||
    (b.priority ?? 0) - (a.priority ?? 0) ||
    a.id.localeCompare(b.id)
  );
}
