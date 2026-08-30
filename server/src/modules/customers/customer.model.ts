/**
 * The customer this API publishes.
 *
 * WHY NOT JUST FORWARD OFFICEGEST'S RECORD
 * ----------------------------------------
 * Three reasons, in order of how much they cost when ignored:
 *
 * 1. **Exposure.** An OfficeGest customer record carries commercial data —
 *    balances, credit limits, internal flags — that a public website has no
 *    business receiving. An explicit model is an allow-list: a field is
 *    published because someone chose to publish it.
 * 2. **Coupling.** Forwarding the upstream shape makes OfficeGest's schema our
 *    public contract, so any rename upstream becomes a breaking change for
 *    every consumer.
 * 3. **Clarity.** Consumers get `taxId` and an ISO date, not `nif` and
 *    `2026-08-28 09:30:00`.
 */
export interface Customer {
  /** OfficeGest's identifier, as a string — it is an opaque key here. */
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
