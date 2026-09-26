/**
 * The domain objects the backend publishes.
 *
 * These mirror the `*.model.ts` files under `server/src/modules/`, field for
 * field. They are not
 * OfficeGest's own records: the backend deliberately maps those onto a narrower
 * shape, so commercial data (balances, credit limits, internal flags) never
 * reaches the browser. Keeping the two in step is a real obligation — if the
 * backend model changes, this file changes with it.
 *
 * Almost every field is optional because the upstream data genuinely is: a
 * vehicle may have no recorded mileage, a customer no e-mail. Templates handle
 * that with an explicit fallback rather than rendering `undefined`.
 */

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly taxId?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly mobile?: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly active?: boolean;
}

export interface Vehicle {
  /** Registration plate, normalised by the backend (`AA00BB`) — the identifier. */
  readonly plate: string;
  /**
   * The workshop's one-line description of the car — typically make, model and
   * engine as the tenant types it. The only free-text field a list row carries.
   */
  readonly description?: string;
  /** Resolved by the backend from the brand table; present on list rows too. */
  readonly brand?: string;
  /** Detail records only — a list row has no model name to resolve cheaply. */
  readonly model?: string;
  /** Detail records only. */
  readonly version?: string;
  readonly fuel?: string;
  readonly color?: string;
  readonly vin?: string;
  readonly mileage?: number;
  /** The tenant's estimate of kilometres driven per month. */
  readonly monthlyMileage?: number;
  readonly nextInspectionAt?: string;
  readonly customerId?: string;
  /** Detail records only. */
  readonly ownerName?: string;
  readonly billingCustomerId?: string;
  readonly active?: boolean;
  /** When OfficeGest first recorded the car. The list's ordering key. */
  readonly registeredAt?: string;
  readonly updatedAt?: string;
}

/** One billed line on a work order — a part, a fluid, or a piece of labour. */
/**
 * One billed line. Mirrors the backend model field for field.
 *
 * `total` used to be documented as gross and was in fact the net figure —
 * upstream sends no `total` at all, so the mapper was reading
 * `total_without_vat`. Both are now published under names that say which is
 * which, and the gross is computed from net + VAT.
 */
export interface ServiceOrderLine {
  readonly id?: string;
  readonly lineNumber?: number;
  readonly articleId?: string;
  readonly description?: string;
  readonly quantity?: number;
  /** Net unit price, before VAT. */
  readonly unitPrice?: number;
  readonly unitPriceWithVat?: number;
  readonly vatPercentage?: number;
  readonly discountPercentage?: number;
  /** Net line total, before VAT. */
  readonly totalWithoutVat?: number;
  readonly vatValue?: number;
  /** Gross line total — net plus VAT, the figure a customer recognises. */
  readonly total?: number;
}

/**
 * A workshop job (folha de obra).
 *
 * Mirrors the backend model field for field. Most of these were added after
 * probing the tenant: the record carries the customer's name, the mechanic, the
 * mileage and the billed lines, none of which used to reach the browser.
 */
export interface ServiceOrder {
  readonly id: string;
  /** What the workshop quotes, e.g. `OSV BF2026/621`. */
  readonly number?: string;
  readonly plate?: string;
  readonly customerId?: string;
  /** The customer's name from the invoice, so a row needs no lookup. */
  readonly customerName?: string;
  /** The tenant's short code — `FAC`, `ESP`, `ENT`, `ANU`… */
  readonly status?: string;
  /** A readable label, when upstream has one that is not an internal token. */
  readonly statusName?: string;
  readonly cancelled?: boolean;
  readonly awaitingParts?: boolean;
  readonly description?: string;
  readonly mechanicNotes?: string;
  readonly openedAt?: string;
  readonly registeredAt?: string;
  readonly expectedDeliveryAt?: string;
  readonly mileage?: number;
  /** Resolve to a name with `Employee`. */
  readonly mechanicId?: string;
  readonly priority?: number;
  readonly total?: number;
  /**
   * The standard time booked on this job, summed across its own
   * interventions' `estimated_time` — real and non-zero, confirmed
   * 2026-09-26. Detail-only, like `lines`.
   */
  readonly estimatedMinutes?: number;
  /**
   * The same booked time, per intervention, in `line_number` order — `null`
   * for a line nobody timed. Unnamed: the names only exist on the monitor's
   * intervention list, which is paired with this one by position.
   */
  readonly interventionMinutes?: readonly (number | null)[];
  /** Billed parts and labour. Detail-only; a list row has none. */
  readonly lines?: readonly ServiceOrderLine[];
}

/**
 * One entry in this order's actual clocked time log —
 * `/workshop/service-orders/{id}/times` on the backend.
 *
 * Unlike everything else this application reads about a work order, this
 * carries a real `endedAt`: it is the one place in the OfficeGest API that
 * records a mechanic's clock-*out*, not only their clock-on.
 */
export interface ServiceOrderTimeEntry {
  readonly id: string;
  readonly employeeId?: string;
  /** On the record itself; no roster lookup needed to show a name. */
  readonly employeeName?: string;
  readonly startedAt?: string;
  /** Absent only for an entry nobody has clocked out of yet. */
  readonly endedAt?: string;
  /** Upstream's own `end − start` in minutes, when the entry is closed. */
  readonly workedMinutes?: number;
  readonly interventionId?: string;
}

/**
 * A member of staff, from OfficeGest's `entities/employees`.
 *
 * This replaced a hand-maintained local roster: the endpoint exists after all,
 * and it is the only staff resource the API publishes — it carries both HR
 * facts and login facts, so it answers both readings of "worker".
 */
/* -------------------------------------------------------------------------- */
/* The live workshop board                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A mechanic currently stood at the car.
 *
 * Mirrors the backend model field for field. Note what is absent: no elapsed
 * time. It is a function of when you ask, so the board computes it from
 * `startedAt` against `MonitorBoard.observedAt` and ticks it in the browser —
 * see `ElapsedTime`.
 */
export interface MonitorMechanic {
  readonly employeeCode: string;
  readonly name?: string;
  /** When they clocked on, ISO-8601. Absent means assigned but not started. */
  readonly startedAt?: string;
  readonly showInMonitor?: boolean;
}

/** One job of work booked on the order. */
export interface MonitorIntervention {
  readonly sequenceNumber?: number;
  readonly name?: string;
  readonly completed: boolean;
  /**
   * Upstream's `duration`, verbatim.
   *
   * Named for what is known about it. The API documents the type and not the
   * unit, and no record has ever carried one, so the board does not render it
   * as a time — it would have to pick minutes or hours to do that, and either
   * choice would be a guess shown to a mechanic as fact.
   */
  readonly durationRaw?: number;
  /**
   * The standard time for this job, in minutes, from the price list.
   *
   * Absent for most: only 38 of the 218 catalogue entries carry a non-zero
   * time, so on this tenant exactly one of 49 live intervention lines has one.
   * The join is by name — the ids on a work order's interventions are document
   * references and match nothing in the catalogue.
   */
  readonly estimatedMinutes?: number;
}

/** The vehicle, expanded on the row so no second request is needed. */
export interface MonitorVehicle {
  readonly plate?: string;
  readonly description?: string;
  readonly manufacturingYear?: number;
  readonly mileage?: number;
  readonly brand?: string;
  readonly model?: string;
  readonly version?: string;
  readonly fuel?: string;
}

/** One card on the board. */
export interface MonitorServiceOrder {
  readonly id: string;
  readonly documentNumber?: string;
  readonly status?: string;
  readonly openedAt?: string;
  readonly customerId?: string;
  readonly customerName?: string;
  readonly plate?: string;
  readonly vehicle?: MonitorVehicle;
  readonly awaitingParts?: boolean;
  readonly priority?: number;
  /** A fraction from 0 to 1, already normalised by the backend. */
  readonly completionPercentage?: number;
  readonly estimatedCompletionAt?: string;
  readonly expectedDeliveryAt?: string;
  readonly badgeColor?: string;
  readonly interventions: readonly MonitorIntervention[];
  readonly mechanics: readonly MonitorMechanic[];
}

/**
 * A mechanic on the workshop's roster, whether or not they are at a car.
 *
 * Distinct from `MonitorMechanic`, which is an *assignment* — a person at a
 * particular car since a particular time. `employeeCode` is what joins the two.
 */
export interface MonitorRosterEntry {
  readonly employeeCode: string;
  readonly name?: string;
  readonly departmentId?: string;
  /**
   * The department's name, resolved by the backend from `departmentId`.
   *
   * Absent when the mechanic has no department, or when the table could not be
   * read — the id is published either way, so "no department" stays
   * distinguishable from "name unavailable".
   */
  readonly department?: string;
}

/** The board, and the server clock every elapsed time is measured from. */
export interface MonitorBoard {
  readonly serviceOrders: readonly MonitorServiceOrder[];
  /** Everyone who could be at a car, so the screen can also show who is free. */
  readonly roster: readonly MonitorRosterEntry[];
  /** The server's own "now" when the snapshot was taken, ISO-8601. */
  readonly observedAt: string;
  /** How many jobs have somebody clocked on. Zero means nobody is recording. */
  readonly activeMechanicCount: number;
}

export interface Employee {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  /** Mobile when there is one, else the landline. */
  readonly phone?: string;
  /** Their OfficeGest sign-in name. */
  readonly login?: string;
  readonly onWorkshopAgenda?: boolean;
  /** ISO date the record was created — the closest thing to "joined". */
  readonly since?: string;
  readonly active?: boolean;
}

/** The answer from a `/count` endpoint. */
export interface ResourceCount {
  readonly total: number;
  /** `false` when the sweep hit its cap, so `total` is a floor. */
  readonly exact: boolean;
}

/**
 * The states a booking can be in.
 *
 * Mirrors `APPOINTMENT_STATUSES` in the backend, which folds them out of three
 * upstream booleans. A closed union because the whole set is knowable — which
 * is what lets the status filter offer exactly the options that can match.
 */
export const APPOINTMENT_STATUSES = ['confirmed', 'completed', 'no_show'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * A booking in the workshop diary.
 *
 * WHAT IS OPTIONAL AND WHY IT MATTERS HERE
 * ----------------------------------------
 * Almost everything. The tenant's records carry a title, two dates, a state, a
 * priority and a location; `customerId` and `notes` are absent from every
 * record probed, and `plate` is only present because the backend reads it out
 * of the title, where the workshop writes it ("30-99-IG / Revisão").
 *
 * So no screen may assume a field exists. The detail page builds its field list
 * from what is actually set rather than rendering a dash for the rest — a
 * column of dashes tells the reader nothing except that the software expected
 * something it did not get.
 */
export interface Appointment {
  readonly id: string;
  readonly title?: string;
  readonly customerId?: string;
  /** Read from the title when upstream sends no plate of its own. */
  readonly plate?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly status?: AppointmentStatus;
  readonly notes?: string;
  /** The member of staff assigned; resolve to a name with `Employee`. */
  readonly employeeId?: string;
  /** Upstream's own code: `N` normal, `H` high. */
  readonly priority?: string;
  /** Free text, e.g. `[1] Sede`. */
  readonly location?: string;
}
