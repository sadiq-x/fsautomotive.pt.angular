/**
 * A member of staff, as this API publishes it.
 *
 * An allow-list over OfficeGest's employee record, for the same reason as every
 * other model here: the upstream record carries `permissions_group`,
 * `warehouses_access` and address details that a workshop roster has no reason
 * to hand to a browser.
 */
export interface Employee {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  /** The mobile when there is one, else the landline — whichever can be rung. */
  readonly phone?: string;
  /** Their OfficeGest sign-in name; the roster's link to a real account. */
  readonly login?: string;
  /** Whether they appear on the workshop's own agenda upstream. */
  readonly onWorkshopAgenda?: boolean;
  /** ISO date the record was created — the closest thing to "joined". */
  readonly since?: string;
  readonly active?: boolean;
}
