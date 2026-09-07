/** A workshop vehicle, as this API publishes it. */
export interface Vehicle {
  /** The registration plate, normalised — OfficeGest's own key for a vehicle. */
  readonly plate: string;
  /**
   * The tenant's own one-line description of the car.
   *
   * Published because it is the ONLY human-readable field the list endpoint
   * returns: `brand_name` and `model_name` exist upstream but only on the
   * detail record, so without this a row is a bare plate.
   */
  readonly description?: string;
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
