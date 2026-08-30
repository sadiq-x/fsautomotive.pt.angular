/** A workshop job (folha de obra), as this API publishes it. */
export interface ServiceOrder {
  readonly id: string;
  /** The number the workshop and the customer actually quote. */
  readonly number?: string;
  readonly plate?: string;
  readonly customerId?: string;
  readonly status?: string;
  readonly description?: string;
  readonly openedAt?: string;
  readonly closedAt?: string;
  /** Net total. Money is published only as a number the caller may display. */
  readonly total?: number;
}
