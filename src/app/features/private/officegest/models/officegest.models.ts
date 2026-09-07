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
   * The workshop's one-line description of the car. On a list row this is the
   * only human-readable field there is: `brand` and `model` reach the backend
   * from OfficeGest's detail record only.
   */
  readonly description?: string;
  readonly brand?: string;
  readonly model?: string;
  readonly version?: string;
  readonly year?: number;
  readonly fuel?: string;
  readonly vin?: string;
  readonly mileage?: number;
  readonly customerId?: string;
  readonly lastServiceAt?: string;
}

export interface ServiceOrder {
  readonly id: string;
  readonly number?: string;
  readonly plate?: string;
  readonly customerId?: string;
  readonly status?: string;
  readonly description?: string;
  readonly openedAt?: string;
  readonly closedAt?: string;
  readonly total?: number;
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

export interface Appointment {
  readonly id: string;
  readonly title?: string;
  readonly customerId?: string;
  readonly plate?: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly status?: string;
  readonly notes?: string;
}
