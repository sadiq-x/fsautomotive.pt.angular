/**
 * Appointment use cases — the only ones in this service that write.
 *
 * WHAT MAKES THIS MORE THAN A PASS-THROUGH
 * ----------------------------------------
 * Booking rules. "A slot cannot be booked in the past" and "a booking cannot run
 * longer than a working day" are statements about the business, not about HTTP,
 * and not about OfficeGest. They are enforced here so they hold no matter who
 * calls — a controller today, a scheduled job tomorrow — and they are tested
 * against an injected clock rather than the machine's, so the suite does not
 * depend on what time it runs.
 */
import type { AppointmentsResource } from '../../integrations/officegest/index.js';
import { AppError, BadRequestError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { CreateAppointmentBody, ListAppointmentsQuery } from './appointment.dto.js';
import { toAppointment, toAppointments, toCreatePayload } from './appointment.mapper.js';
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

/** A booking may not be longer than this. Guards against a typo'd year. */
const MAX_DURATION_MS = 12 * 60 * 60 * 1000;

/** How far into the past a start time may drift, to tolerate clock skew. */
const PAST_TOLERANCE_MS = 60_000;

export interface AppointmentList {
  readonly appointments: readonly Appointment[];
  readonly meta: PaginationMeta;
}

export class AppointmentsService {
  constructor(
    private readonly appointments: AppointmentsResource,
    /** Injected so the booking rules are testable at a fixed instant. */
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: ListAppointmentsQuery, context: UseCaseContext): Promise<AppointmentList> {
    if (query.from && query.to && Date.parse(query.from) > Date.parse(query.to)) {
      throw new BadRequestError('`from` must not be later than `to`.');
    }

    // Upstream mandates both ends of the range; the caller's values win, and
    // the default only fills a gap they left.
    const now = this.now().getTime();
    const from = query.from ?? new Date(now - DEFAULT_WINDOW_DAYS_BACK * DAY_MS).toISOString();
    const to = query.to ?? new Date(now + DEFAULT_WINDOW_DAYS_AHEAD * DAY_MS).toISOString();

    const result = await this.appointments.list(
      {
        page: query.page,
        perPage: query.perPage,
        filters: {
          [UPSTREAM_FILTERS.from]: from,
          [UPSTREAM_FILTERS.to]: to,
          [UPSTREAM_FILTERS.customerId]: query.customerId,
        },
      },
      { logger: context.logger, signal: context.signal },
    );

    return {
      appointments: toAppointments(result.items),
      meta: toPaginationMeta(query, result.meta?.['total']),
    };
  }

  async getById(appointmentId: string, context: UseCaseContext): Promise<Appointment> {
    const record = await this.appointments.getById(appointmentId, {
      logger: context.logger,
      signal: context.signal,
    });

    return this.requireMappable(record, appointmentId, context);
  }

  /**
   * Books an appointment.
   *
   * The rules run before the upstream call, deliberately: rejecting locally
   * costs nothing, while letting an obviously invalid booking through spends an
   * upstream round trip and may create a record someone then has to delete.
   */
  async create(body: CreateAppointmentBody, context: UseCaseContext): Promise<Appointment> {
    this.assertBookable(body);

    const record = await this.appointments.create(toCreatePayload(body), {
      logger: context.logger,
      signal: context.signal,
    });

    context.logger.info('created OfficeGest appointment', {
      // The title and notes may carry a customer's name; the shape of the
      // booking is enough to audit it.
      hasCustomer: body.customerId !== undefined,
      hasPlate: body.plate !== undefined,
      startsAt: body.startsAt,
    });

    return this.requireMappable(record, 'created', context);
  }

  private assertBookable(body: CreateAppointmentBody): void {
    const startsAt = Date.parse(body.startsAt);

    if (startsAt < this.now().getTime() - PAST_TOLERANCE_MS) {
      throw new BadRequestError('`startsAt` must be in the future.');
    }

    if (body.endsAt !== undefined && Date.parse(body.endsAt) - startsAt > MAX_DURATION_MS) {
      throw new BadRequestError('An appointment may not be longer than 12 hours.');
    }
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
