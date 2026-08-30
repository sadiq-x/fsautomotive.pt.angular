/** A CRM appointment (marcação), as this API publishes it. */
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
