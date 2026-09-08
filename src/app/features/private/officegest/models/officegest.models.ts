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
export interface ServiceOrderLine {
  readonly id?: string;
  readonly description?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  /** Gross, i.e. with VAT — the figure a customer recognises. */
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
  readonly closedAt?: string;
  readonly registeredAt?: string;
  readonly expectedDeliveryAt?: string;
  readonly mileage?: number;
  /** Resolve to a name with `Employee`. */
  readonly mechanicId?: string;
  readonly priority?: number;
  readonly total?: number;
  /** Billed parts and labour. Detail-only; a list row has none. */
  readonly lines?: readonly ServiceOrderLine[];
}

/**
 * A member of staff, from OfficeGest's `entities/employees`.
 *
 * This replaced a hand-maintained local roster: the endpoint exists after all,
 * and it is the only staff resource the API publishes — it carries both HR
 * facts and login facts, so it answers both readings of "worker".
 */
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
