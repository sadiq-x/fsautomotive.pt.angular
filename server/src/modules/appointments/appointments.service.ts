/**
 * Appointment use cases.
 *
 * WHAT MAKES THIS MORE THAN A PASS-THROUGH
 * ----------------------------------------
 * The date window. OfficeGest *requires* a range and rejects a request without
 * one, so "list the appointments" is never a bare forward: a window has to
 * exist, and choosing it is a decision about the product rather than about
 * HTTP. It is made here, against an injected clock, so the suite does not
 * depend on what time it runs.
 */
import type { AppointmentsResource } from '../../integrations/officegest/index.js';
import { AppError, BadRequestError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { readHasMore, toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { ListAppointmentsQuery } from './appointment.dto.js';
import { toAppointment, toAppointments } from './appointment.mapper.js';
import type { Appointment } from './appointment.model.js';

/**
 * Upstream filter parameter names.
 *
 * `start` and `end` are CONFIRMED against the tenant, and they are **required**:
 * `GET /crm/appointments` answers 422 without them —
 * "O campo start é obrigatório" — whatever else is sent. The previous names
 * (`start_date` / `end_date`) were inferred and wrong, so every unfiltered list
 * request failed validation upstream.
 *
 * Any of `YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss` and full ISO-8601 are accepted, so
 * the caller's ISO values are forwarded unchanged.
 *
 * `customerId` remains ⚠️ INFERRED — it has not been exercised against a tenant
 * that would accept the request.
 */
const UPSTREAM_FILTERS = {
  from: 'start',
  to: 'end',
  customerId: 'customer_id',
} as const;

/**
 * The window used when the caller asks for no particular one.
 *
 * OfficeGest requires a range, so "no filter" cannot mean "everything" — a
 * default has to be invented, and this is the only invented value in this file.
 * Thirty days back and ninety forward is what a workshop's bookings screen is
 * about: recent history plus the coming quarter. Change it here; nothing else
 * depends on the numbers.
 */
const DEFAULT_WINDOW_DAYS_BACK = 30;
const DEFAULT_WINDOW_DAYS_AHEAD = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How the window is fetched from upstream.
 *
 * The page size is upstream's maximum, so a normal month is one request. The
 * cap bounds the worst case: ten requests, and a log line if even that was not
 * enough. For scale, this tenant's entire 2026 diary is 287 bookings.
 */
const WINDOW_PAGE_SIZE = 100;
const MAX_WINDOW_PAGES = 10;

/**
 * Newest first, and stable.
 *
 * A booking with no start date sorts last rather than first: it is the least
 * useful row on the screen, and putting it at the top would push the bookings
 * someone actually came to see below the fold. Ties fall back to the id so the
 * order does not wobble between two requests for the same page.
 */
function byMostRecent(a: Appointment, b: Appointment): number {
  const left = a.startsAt ? Date.parse(a.startsAt) : Number.NEGATIVE_INFINITY;
  const right = b.startsAt ? Date.parse(b.startsAt) : Number.NEGATIVE_INFINITY;

  return right - left || a.id.localeCompare(b.id);
}

/**
 * Whether one booking satisfies the filters upstream cannot express.
 *
 * The search is accent- and case-insensitive: "revisao" must find "Revisão",
 * because nobody types the diacritic into a search box, and a search that
 * misses on that is a search people stop using.
 */
function matches(appointment: Appointment, query: ListAppointmentsQuery): boolean {
  if (query.status !== undefined) {
    const status = appointment.status ?? 'none';

    if (status !== query.status) {
      return false;
    }
  }

  if (query.search === undefined) {
    return true;
  }

  const needle = fold(query.search);

  return [
    appointment.title,
    appointment.location,
    appointment.plate,
    appointment.notes,
    appointment.id,
  ].some((field) => field !== undefined && fold(field).includes(needle));
}

/**
 * A comparison key: trimmed, lower-cased and stripped of diacritics.
 *
 * The DTO already trims the search term, but this does not rely on that. A use
 * case that silently returns nothing when handed a stray space is a use case
 * whose correctness depends on its caller, and this one is called from a
 * controller today and could be called from anywhere tomorrow.
 */
function fold(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export interface AppointmentList {
  readonly appointments: readonly Appointment[];
  readonly meta: PaginationMeta;
}

export class AppointmentsService {
  constructor(
    private readonly appointments: AppointmentsResource,
    /** Injected so the default window is testable at a fixed instant. */
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * The bookings in a window, newest first.
   *
   * WHY THE WHOLE WINDOW IS FETCHED BEFORE A PAGE IS RETURNED
   * ---------------------------------------------------------
   * Two of the three things this method promises cannot be done on one upstream
   * page:
   *
   * - **Order.** "Most recent first" across the result set is not the same as
   *   sorting the twenty rows that happen to be on page 2. Upstream defines no
   *   order we can rely on, so the sort has to see everything.
   * - **Filtering by state or text.** OfficeGest accepts neither as a query
   *   parameter — the state is not even a field, it is three booleans this
   *   service folds together. Applying such a filter to a single page would
   *   return "3 of 10 rows" on page 1 and call it the answer.
   *
   * So the window is collected, mapped, filtered, sorted, and only then cut
   * into the requested page. This is affordable because the window is bounded
   * by construction — upstream *requires* a date range, the screen asks for one
   * month, and this tenant's whole 2026 diary is 287 records. `MAX_WINDOW_PAGES`
   * is the guard for the case where that assumption stops holding.
   *
   * The pleasant side effect: `total` is now exact. Every other list in this
   * API has to offer a separate "count" action because OfficeGest reports no
   * total; here we have counted the window ourselves.
   */
  async list(query: ListAppointmentsQuery, context: UseCaseContext): Promise<AppointmentList> {
    if (query.from && query.to && Date.parse(query.from) > Date.parse(query.to)) {
      throw new BadRequestError('`from` must not be later than `to`.');
    }

    // Upstream mandates both ends of the range; the caller's values win, and
    // the default only fills a gap they left.
    const now = this.now().getTime();
    const from = query.from ?? new Date(now - DEFAULT_WINDOW_DAYS_BACK * DAY_MS).toISOString();
    const to = query.to ?? new Date(now + DEFAULT_WINDOW_DAYS_AHEAD * DAY_MS).toISOString();

    const window = await this.collectWindow(from, to, query.customerId, context);
    // `filter` already returns a fresh array, so sorting it in place cannot
    // disturb what `collectWindow` gathered.
    const ordered = window.filter((appointment) => matches(appointment, query)).sort(byMostRecent);

    const offset = (query.page - 1) * query.perPage;
    const page = ordered.slice(offset, offset + query.perPage);

    return {
      appointments: page,
      // `hasMore` is stated rather than left to the caller's arithmetic: it is
      // the flag every other list in this API reports, so the shape stays the
      // same whether or not a total was available.
      meta: toPaginationMeta(query, ordered.length, offset + page.length < ordered.length),
    };
  }

  /**
   * Every appointment in the range, following upstream's paging.
   *
   * Stops at `MAX_WINDOW_PAGES`, and says so in the log rather than silently
   * returning a truncated diary — a quiet cut here would show up as bookings
   * that simply do not exist on screen.
   */
  private async collectWindow(
    from: string,
    to: string,
    customerId: string | undefined,
    context: UseCaseContext,
  ): Promise<readonly Appointment[]> {
    const collected: Appointment[] = [];

    for (let page = 1; page <= MAX_WINDOW_PAGES; page += 1) {
      const result = await this.appointments.list(
        {
          page,
          perPage: WINDOW_PAGE_SIZE,
          filters: {
            [UPSTREAM_FILTERS.from]: from,
            [UPSTREAM_FILTERS.to]: to,
            [UPSTREAM_FILTERS.customerId]: customerId,
          },
        },
        { logger: context.logger, signal: context.signal },
      );

      collected.push(...toAppointments(result.items));

      // `has_more` is the only paging signal OfficeGest sends. A short page is
      // the fallback: it cannot be wrong in the direction that matters, since
      // a full last page just costs one extra empty request.
      const hasMore = readHasMore(result.meta) ?? result.items.length === WINDOW_PAGE_SIZE;

      if (!hasMore || result.items.length === 0) {
        return collected;
      }

      if (page === MAX_WINDOW_PAGES) {
        context.logger.warn('appointment window truncated at the page cap', {
          maxPages: MAX_WINDOW_PAGES,
          collected: collected.length,
          from,
          to,
        });
      }
    }

    return collected;
  }

  async getById(appointmentId: string, context: UseCaseContext): Promise<Appointment> {
    const record = await this.appointments.getById(appointmentId, {
      logger: context.logger,
      signal: context.signal,
    });

    return this.requireMappable(record, appointmentId, context);
  }

  private requireMappable(
    record: Parameters<typeof toAppointment>[0],
    reference: string,
    context: UseCaseContext,
  ): Appointment {
    const appointment = toAppointment(record);

    if (!appointment) {
      context.logger.error('OfficeGest appointment has no usable identifier', { reference });
      throw new AppError(
        502,
        ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
        'OfficeGest returned an unexpected response.',
      );
    }

    return appointment;
  }
}
