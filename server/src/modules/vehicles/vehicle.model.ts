/** A workshop vehicle, as this API publishes it. */
export interface Vehicle {
  /** The registration plate, normalised — OfficeGest's own key for a vehicle. */
  readonly plate: string;
  readonly brand?: string;
  readonly model?: string;
  readonly version?: string;
  readonly year?: number;
  readonly fuel?: string;
  /** Chassis number. Published because a workshop identifies a car by it. */
  readonly vin?: string;
  readonly mileage?: number;
  /** Links back to `/api/officegest/customers/:customerId`. */
  readonly customerId?: string;
  readonly lastServiceAt?: string;
}
